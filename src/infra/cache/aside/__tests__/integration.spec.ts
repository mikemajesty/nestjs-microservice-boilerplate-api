/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/infra/cache-aside.md
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/tests/standards.md
 */

import { ICacheAdapter } from '@/infra/cache'
import { MockUtils } from '@/utils/test'
import { TestRedisContainer } from '@/utils/test/e2e/containers'

import { CacheAsideService } from '../service'

type CachedRole = {
  id: string
  permissions: string[]
}

describe(CacheAsideService.name, () => {
  const redisContainer = new TestRedisContainer()
  const logger = MockUtils.Logger()

  let cache: ICacheAdapter
  let service: CacheAsideService

  beforeAll(async () => {
    cache = await redisContainer.getTestRedis()
    service = new CacheAsideService(logger, cache)
  })

  afterEach(async () => {
    await redisContainer.client.flushdb()
  })

  afterAll(async () => {
    await redisContainer.close()
  })

  test('when multiple keys miss, should persist them in one transaction and reuse them on the next read', async () => {
    const keys = ['role:id:1', 'role:id:2', 'role:id:3']
    const values: CachedRole[] = keys.map((key) => ({
      id: key.replace('role:id:', ''),
      permissions: ['user:read']
    }))
    const loader = async (missingKeys: string[]) => {
      return new Map(missingKeys.map((key) => [key, values.find((value) => key.endsWith(value.id))!]))
    }
    const monitor = await redisContainer.client.monitor()
    const monitoredCommands: string[] = []
    const pingObserved = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Redis PING was not observed')), 1_000)
      monitor.on('monitor', (_timestamp, args) => {
        const command = args[0]?.toLowerCase()
        if (command) {
          monitoredCommands.push(command)
        }
        if (command === 'ping') {
          clearTimeout(timeout)
          resolve()
        }
      })
    })

    try {
      await expect(service.readThroughMany(keys, loader, { ttlSeconds: 60 })).resolves.toEqual(values)
      await redisContainer.client.ping()
      await expect(pingObserved).resolves.toBeUndefined()
      expect(monitoredCommands.filter((command) => command === 'exec')).toHaveLength(1)
      expect(await redisContainer.client.mget(...keys)).toEqual(values.map((value) => JSON.stringify(value)))

      let cachedLoaderCalls = 0
      const cachedLoader = async () => {
        cachedLoaderCalls++
        return new Map<string, CachedRole>()
      }
      await expect(service.readThroughMany(keys, cachedLoader, { ttlSeconds: 60 })).resolves.toEqual(values)
      expect(cachedLoaderCalls).toBe(0)
    } finally {
      monitor.disconnect()
    }
  })

  test('when some keys are cached, should load only missing keys and preserve input order', async () => {
    const keys = ['role:id:1', 'role:id:2', 'role:id:3']
    const cachedFirst: CachedRole = { id: '1', permissions: ['user:read'] }
    const loadedSecond: CachedRole = { id: '2', permissions: ['user:write'] }
    const cachedThird: CachedRole = { id: '3', permissions: ['user:delete'] }

    await redisContainer.client.mset(keys[0], JSON.stringify(cachedFirst), keys[2], JSON.stringify(cachedThird))

    let receivedMissingKeys: string[] = []
    const loader = async (missingKeys: string[]) => {
      receivedMissingKeys = missingKeys
      return new Map([[missingKeys[0], loadedSecond]])
    }

    await expect(service.readThroughMany(keys, loader, { ttlSeconds: 60 })).resolves.toEqual([
      cachedFirst,
      loadedSecond,
      cachedThird
    ])
    expect(receivedMissingKeys).toEqual([keys[1]])
    expect(await redisContainer.client.mget(...keys)).toEqual([
      JSON.stringify(cachedFirst),
      JSON.stringify(loadedSecond),
      JSON.stringify(cachedThird)
    ])
  })

  test('when null caching is enabled, should cache keys not found by the loader', async () => {
    const keys = ['role:id:1', 'role:id:2', 'role:id:3']
    const foundRole: CachedRole = { id: '2', permissions: ['user:read'] }
    const options = { ttlSeconds: 60, nullTtlSeconds: 5, cacheNullResults: true }
    let loaderCalls = 0

    await expect(
      service.readThroughMany(
        keys,
        async (missingKeys) => {
          loaderCalls++
          return new Map([[missingKeys[1], foundRole]])
        },
        options
      )
    ).resolves.toEqual([null, foundRole, null])
    expect(await redisContainer.client.mget(...keys)).toEqual([
      JSON.stringify('__cache-aside:null__'),
      JSON.stringify(foundRole),
      JSON.stringify('__cache-aside:null__')
    ])
    expect(await redisContainer.client.pttl(keys[0])).toBeLessThanOrEqual(5_000)
    expect(await redisContainer.client.pttl(keys[2])).toBeLessThanOrEqual(5_000)

    await expect(service.readThroughMany(keys, async () => new Map(), options)).resolves.toEqual([
      null,
      foundRole,
      null
    ])
    expect(loaderCalls).toBe(1)
  })

  test('when null caching is disabled, should not cache keys not found by the loader', async () => {
    const key = 'role:id:missing'
    let loaderCalls = 0
    const loader = async () => {
      loaderCalls++
      return new Map<string, CachedRole>()
    }

    await expect(service.readThroughMany([key], loader, { ttlSeconds: 60 })).resolves.toEqual([null])
    expect(await redisContainer.client.get(key)).toBeNull()

    await expect(service.readThroughMany([key], loader, { ttlSeconds: 60 })).resolves.toEqual([null])
    expect(loaderCalls).toBe(2)
  })

  test('when cached JSON is corrupted, should reload and replace it with the loaded value', async () => {
    const key = 'role:id:1'
    const loaded: CachedRole = { id: '1', permissions: ['user:read'] }

    await redisContainer.client.set(key, '{invalid-json')

    await expect(service.readThrough(key, () => loaded, { ttlSeconds: 60 })).resolves.toEqual(loaded)
    expect(await redisContainer.client.get(key)).toBe(JSON.stringify(loaded))
  })

  test('when single-flight reads run concurrently, should share one loader execution', async () => {
    const key = 'role:id:1'
    const loaded: CachedRole = { id: '1', permissions: ['user:read'] }
    let resolveLoader: (value: CachedRole) => void = () => undefined
    let signalLoaderStarted: () => void = () => undefined
    const loaderStarted = new Promise<void>((resolve) => {
      signalLoaderStarted = resolve
    })
    let loaderCalls = 0
    const loader = () =>
      new Promise<CachedRole>((resolve) => {
        loaderCalls++
        resolveLoader = resolve
        signalLoaderStarted()
      })

    const first = service.readThroughSingleFlight(key, loader, { ttlSeconds: 60 })
    const second = service.readThroughSingleFlight(key, loader, { ttlSeconds: 60 })

    await loaderStarted
    expect(loaderCalls).toBe(1)

    resolveLoader(loaded)

    await expect(Promise.all([first, second])).resolves.toEqual([loaded, loaded])
    expect(await redisContainer.client.get(key)).toBe(JSON.stringify(loaded))
  })

  test('when a single-flight loader fails, should allow a subsequent load', async () => {
    const key = 'role:id:1'
    const loaded: CachedRole = { id: '1', permissions: ['user:read'] }
    let loaderCalls = 0
    const loader = async () => {
      loaderCalls++
      if (loaderCalls === 1) {
        throw new Error('database unavailable')
      }
      return loaded
    }

    await expect(service.readThroughSingleFlight(key, loader, { ttlSeconds: 60 })).rejects.toThrow('database unavailable')
    await expect(service.readThroughSingleFlight(key, loader, { ttlSeconds: 60 })).resolves.toEqual(loaded)
    expect(loaderCalls).toBe(2)
    expect(await redisContainer.client.get(key)).toBe(JSON.stringify(loaded))
  })

  test('when invalidating one or multiple keys, should remove their Redis values', async () => {
    const keys = ['role:id:1', 'role:id:2', 'role:id:3']

    await redisContainer.client.mset(...keys.flatMap((key) => [key, JSON.stringify({ id: key })]))

    await service.invalidate(keys[0])
    await service.invalidateMany(keys.slice(1))

    expect(await redisContainer.client.mget(...keys)).toEqual([null, null, null])
  })

  test('when invalidating a tag, should remove only entries associated with it', async () => {
    const taggedKeys = ['role:id:1', 'role:id:2']
    const retainedKey = 'role:id:3'

    for (const key of taggedKeys) {
      await service.readThrough(key, () => ({ id: key }), {
        ttlSeconds: 60,
        tags: [{ key: 'permission:id:1', ttlSeconds: 2 }]
      })
    }
    await service.readThrough(retainedKey, () => ({ id: retainedKey }), {
      ttlSeconds: 60,
      tags: [{ key: 'permission:id:2', ttlSeconds: 2 }]
    })

    expect(await redisContainer.client.hgetall('cache-aside:tag:permission:id:1')).toEqual({
      [taggedKeys[0]]: '1',
      [taggedKeys[1]]: '1'
    })
    expect(await redisContainer.client.pttl('cache-aside:tag:permission:id:1')).toBeLessThanOrEqual(2_200)
    expect(await redisContainer.client.pttl('cache-aside:tag:permission:id:1')).toBeGreaterThan(0)

    await service.invalidateByTag('permission:id:1')

    expect(await redisContainer.client.mget(...taggedKeys, retainedKey)).toEqual([
      null,
      null,
      JSON.stringify({ id: retainedKey })
    ])
    expect(await redisContainer.client.exists('cache-aside:tag:permission:id:1')).toBe(0)
    expect(await redisContainer.client.hgetall('cache-aside:tag:permission:id:2')).toEqual({ [retainedKey]: '1' })
  })

  test('when null caching is enabled, should cache a sentinel and reload after expiration', async () => {
    const key = 'user:id:missing'
    let loaderCalls = 0
    const loader = async () => {
      loaderCalls++
      return null
    }

    const options = { ttlSeconds: 60, nullTtlSeconds: 1, cacheNullResults: true }

    await expect(service.readThrough(key, loader, options)).resolves.toBeNull()
    expect(await redisContainer.client.get(key)).toBe(JSON.stringify('__cache-aside:null__'))
    expect(await redisContainer.client.pttl(key)).toBeGreaterThan(0)

    await expect(service.readThrough(key, loader, options)).resolves.toBeNull()
    expect(loaderCalls).toBe(1)

    await new Promise((resolve) => setTimeout(resolve, 1_100))

    await expect(service.readThrough(key, loader, options)).resolves.toBeNull()
    expect(loaderCalls).toBe(2)
  })

  test('when a loader returns undefined, should not persist a cache value', async () => {
    const key = 'role:id:undefined'

    await expect(service.readThrough(key, () => undefined, { ttlSeconds: 60 })).resolves.toBeUndefined()
    expect(await redisContainer.client.get(key)).toBeNull()
  })

  test('when a batch contains null sentinels and corrupted values, should reload only corrupted values', async () => {
    const keys = ['role:id:cached', 'role:id:null', 'role:id:corrupted']
    const cached: CachedRole = { id: 'cached', permissions: ['user:read'] }
    const reloaded: CachedRole = { id: 'corrupted', permissions: ['user:write'] }
    let receivedMissingKeys: string[] = []

    await redisContainer.client.mset(
      keys[0],
      JSON.stringify(cached),
      keys[1],
      JSON.stringify('__cache-aside:null__'),
      keys[2],
      '{invalid-json'
    )

    await expect(
      service.readThroughMany(
        keys,
        async (missingKeys) => {
          receivedMissingKeys = missingKeys
          return new Map([[keys[2], reloaded]])
        },
        { ttlSeconds: 60 }
      )
    ).resolves.toEqual([cached, null, reloaded])

    expect(receivedMissingKeys).toEqual([keys[2]])
    expect(await redisContainer.client.mget(...keys)).toEqual([
      JSON.stringify(cached),
      JSON.stringify('__cache-aside:null__'),
      JSON.stringify(reloaded)
    ])
  })

  test('when a tag TTL exceeds its key TTL, should bound the tag TTL by the key TTL', async () => {
    const key = 'role:id:ttl'
    const tagKey = 'cache-aside:tag:permission:id:ttl'

    await service.readThrough(key, () => ({ id: key }), {
      ttlSeconds: 1,
      tags: [{ key: 'permission:id:ttl', ttlSeconds: 60 }]
    })

    const [keyTtl, tagTtl] = await Promise.all([redisContainer.client.pttl(key), redisContainer.client.pttl(tagKey)])
    expect(keyTtl).toBeGreaterThan(0)
    expect(tagTtl).toBeGreaterThan(0)
    expect(tagTtl).toBeLessThanOrEqual(keyTtl)
  })

  test('when invalidating empty or unknown entries, should leave unrelated values untouched', async () => {
    const retainedKey = 'role:id:retained'
    await redisContainer.client.set(retainedKey, JSON.stringify({ id: retainedKey }))

    await expect(service.invalidateMany([])).resolves.toBeUndefined()
    await expect(service.invalidateByTag('permission:id:missing')).resolves.toBeUndefined()

    expect(await redisContainer.client.get(retainedKey)).toBe(JSON.stringify({ id: retainedKey }))
    expect(await redisContainer.client.exists('cache-aside:tag:permission:id:missing')).toBe(0)
  })

  test('when a tag has more keys than the Redis Lua unpack limit, should invalidate all of them', async () => {
    const tag = 'permission:id:large'
    const tagKey = `cache-aside:tag:${tag}`
    const keys = Array.from({ length: 8_001 }, (_, index) => `role:id:large:${index}`)
    const pipeline = redisContainer.client.pipeline()

    for (const key of keys) {
      pipeline.set(key, '1')
      pipeline.hset(tagKey, key, '1')
    }
    await pipeline.exec()

    await service.invalidateByTag(tag)

    expect(await redisContainer.client.exists(keys[0], keys[7_000], keys.at(-1)!)).toBe(0)
    expect(await redisContainer.client.exists(tagKey)).toBe(0)
  })

  test('when separate service instances read concurrently, should preserve a consistent cached value', async () => {
    const key = 'role:id:concurrent'
    const loaded: CachedRole = { id: 'concurrent', permissions: ['user:read'] }
    const otherService = new CacheAsideService(logger, cache)
    let loaderCalls = 0
    const loader = async () => {
      loaderCalls++
      return loaded
    }

    const results = await Promise.all(
      Array.from({ length: 20 }, (_, index) =>
        (index % 2 === 0 ? service : otherService).readThroughSingleFlight(key, loader, { ttlSeconds: 60 })
      )
    )

    expect(results).toEqual(Array.from({ length: 20 }, () => loaded))
    expect(loaderCalls).toBe(2)
    expect(await redisContainer.client.get(key)).toBe(JSON.stringify(loaded))
  })

  test('when no keys are requested, should return an empty result without querying Redis', async () => {
    let loaderCalls = 0
    const loader = async () => {
      loaderCalls++
      return new Map<string, CachedRole>()
    }

    await expect(service.readThroughMany([], loader, { ttlSeconds: 60 })).resolves.toEqual([])
    expect(loaderCalls).toBe(0)
  })
})
