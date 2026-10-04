import { ICacheAdapter } from '@/infra/cache'
import { ILoggerAdapter } from '@/infra/logger'
import { TestRedisContainer } from '@/utils/test/e2e/containers'

import { CacheAsideService } from '../service'

type CachedRole = {
  id: string
  permissions: string[]
}

describe(`CacheAsideService integration`, () => {
  const redisContainer = new TestRedisContainer()
  const logger = {
    debug: () => undefined,
    error: () => undefined,
    warn: () => undefined
  } as Partial<ILoggerAdapter> as ILoggerAdapter

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

  it('should persist multiple cache misses in one transaction and reuse them on the next read', async () => {
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

  it('should load and persist only missing keys while preserving cached values and input order', async () => {
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

  it('should return null and avoid caching keys not found by the loader', async () => {
    const keys = ['role:id:1', 'role:id:2', 'role:id:3']
    const foundRole: CachedRole = { id: '2', permissions: ['user:read'] }

    await expect(
      service.readThroughMany(
        keys,
        async (missingKeys) => new Map([[missingKeys[1], foundRole]]),
        { ttlSeconds: 60 }
      )
    ).resolves.toEqual([null, foundRole, null])
    expect(await redisContainer.client.mget(...keys)).toEqual([null, JSON.stringify(foundRole), null])
  })

  it('should treat corrupted cached JSON as a miss and replace it with the loaded value', async () => {
    const key = 'role:id:1'
    const loaded: CachedRole = { id: '1', permissions: ['user:read'] }

    await redisContainer.client.set(key, '{invalid-json')

    await expect(service.readThrough(key, () => loaded, { ttlSeconds: 60 })).resolves.toEqual(loaded)
    expect(await redisContainer.client.get(key)).toBe(JSON.stringify(loaded))
  })

  it('should share a single loader execution between concurrent single-flight reads', async () => {
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

  it('should allow a new single-flight load after the previous loader fails', async () => {
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

  it('should remove values from Redis when invalidating one or multiple keys', async () => {
    const keys = ['role:id:1', 'role:id:2', 'role:id:3']

    await redisContainer.client.mset(...keys.flatMap((key) => [key, JSON.stringify({ id: key })]))

    await service.invalidate(keys[0])
    await service.invalidateMany(keys.slice(1))

    expect(await redisContainer.client.mget(...keys)).toEqual([null, null, null])
  })

  it('should invalidate only entries associated with the requested tag', async () => {
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

  it('should cache null with the null TTL sentinel and reload after expiration', async () => {
    const key = 'user:id:missing'
    let loaderCalls = 0
    const loader = async () => {
      loaderCalls++
      return null
    }

    await expect(service.readThrough(key, loader, { ttlSeconds: 60, nullTtlSeconds: 1 })).resolves.toBeNull()
    expect(await redisContainer.client.get(key)).toBe(JSON.stringify('__cache-aside:null__'))
    expect(await redisContainer.client.pttl(key)).toBeGreaterThan(0)

    await expect(service.readThrough(key, loader, { ttlSeconds: 60, nullTtlSeconds: 1 })).resolves.toBeNull()
    expect(loaderCalls).toBe(1)

    await new Promise((resolve) => setTimeout(resolve, 1_100))

    await expect(service.readThrough(key, loader, { ttlSeconds: 60, nullTtlSeconds: 1 })).resolves.toBeNull()
    expect(loaderCalls).toBe(2)
  })

  it('should not persist undefined loader results', async () => {
    const key = 'role:id:undefined'

    await expect(service.readThrough(key, () => undefined, { ttlSeconds: 60 })).resolves.toBeUndefined()
    expect(await redisContainer.client.get(key)).toBeNull()
  })

  it('should treat a null sentinel as a hit while reloading only corrupted values from a batch', async () => {
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

  it('should bound a tag TTL by its cached key TTL', async () => {
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

  it('should treat empty and unknown invalidations as safe no-ops', async () => {
    const retainedKey = 'role:id:retained'
    await redisContainer.client.set(retainedKey, JSON.stringify({ id: retainedKey }))

    await expect(service.invalidateMany([])).resolves.toBeUndefined()
    await expect(service.invalidateByTag('permission:id:missing')).resolves.toBeUndefined()

    expect(await redisContainer.client.get(retainedKey)).toBe(JSON.stringify({ id: retainedKey }))
    expect(await redisContainer.client.exists('cache-aside:tag:permission:id:missing')).toBe(0)
  })

  it('should invalidate tags with more keys than the Redis Lua unpack limit', async () => {
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

  it('should preserve a consistent cached value during concurrent reads from separate service instances', async () => {
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

  it('should return an empty result without querying Redis when no keys are requested', async () => {
    let loaderCalls = 0
    const loader = async () => {
      loaderCalls++
      return new Map<string, CachedRole>()
    }

    await expect(service.readThroughMany([], loader, { ttlSeconds: 60 })).resolves.toEqual([])
    expect(loaderCalls).toBe(0)
  })
})
