/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/infra/cache-aside.md
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/tests/standards.md
 */

import { ICacheAdapter } from '@/infra/cache'
import { JitterUtils } from '@/utils/jitter'
import { MockUtils, TestUtils } from '@/utils/test'

import { CacheAsideService } from '../service'

describe(CacheAsideService.name, () => {
  const logger = MockUtils.Logger()

  let cache: ICacheAdapter
  let service: CacheAsideService

  beforeEach(() => {
    cache = {} as ICacheAdapter
    service = new CacheAsideService(logger, cache)
  })

  afterEach(() => {
    TestUtils.restoreMocks()
    TestUtils.clearMocks()
  })

  test('when a cache read fails, should load and store the value', async () => {
    const loaded = { id: '1' }
    const loader = TestUtils.mockResolvedValue<typeof loaded>(loaded)
    cache.get = TestUtils.mockRejectedValue<string | null>(new Error('Redis unavailable'))
    cache.multiExec = TestUtils.mockResolvedValue<void>()

    await expect(service.readThrough('role:id:1', loader, { ttlSeconds: 60 })).resolves.toEqual(loaded)

    expect(loader).toHaveBeenCalledTimes(1)
    expect(cache.multiExec).toHaveBeenCalledTimes(1)
    expect(logger.error).toHaveBeenCalledTimes(1)
  })

  test('when an MGET fails, should load all requested keys', async () => {
    const keys = ['role:id:1', 'role:id:2']
    const loaded = new Map([
      [keys[0], { id: '1' }],
      [keys[1], { id: '2' }]
    ])
    const loader = TestUtils.mockResolvedValue<typeof loaded>(loaded)
    cache.mGet = TestUtils.mockRejectedValue<(string | null)[]>(new Error('Redis unavailable'))
    cache.multiExec = TestUtils.mockResolvedValue<void>()

    await expect(service.readThroughMany(keys, loader, { ttlSeconds: 60 })).resolves.toEqual([
      { id: '1' },
      { id: '2' }
    ])

    expect(loader).toHaveBeenCalledWith(keys)
    expect(cache.multiExec).toHaveBeenCalledTimes(1)
    expect(logger.error).toHaveBeenCalledTimes(1)
  })

  test('when null caching is enabled, should cache missing batch results using the null TTL', async () => {
    const keys = ['role:id:1', 'role:id:2', 'role:id:3']
    const found = { id: '2' }
    const options = { ttlSeconds: 60, nullTtlSeconds: 10, cacheNullResults: true }
    const applyTtl = TestUtils.spyOn(JitterUtils, 'applyTtl').mockImplementation((ttl) => ttl)
    const loader = TestUtils.mockResolvedValue<Map<string, typeof found>>(new Map([[keys[1], found]]))
    cache.mGet = TestUtils.mockResolvedValue<(string | null)[]>([null, null, null])
    cache.multiExec = TestUtils.mockResolvedValue<void>()

    await expect(service.readThroughMany(keys, loader, options)).resolves.toEqual([null, found, null])

    expect(applyTtl).toHaveBeenNthCalledWith(1, options.ttlSeconds)
    expect(applyTtl).toHaveBeenNthCalledWith(2, options.nullTtlSeconds)
    expect(applyTtl).toHaveBeenNthCalledWith(3, options.nullTtlSeconds)
    expect(cache.multiExec).toHaveBeenCalledWith([
      ['set', keys[1], JSON.stringify(found), 'PX', 60_000],
      ['set', keys[0], JSON.stringify('__cache-aside:null__'), 'PX', 10_000],
      ['set', keys[2], JSON.stringify('__cache-aside:null__'), 'PX', 10_000]
    ])

    cache.mGet = TestUtils.mockResolvedValue<(string | null)[]>([
      JSON.stringify('__cache-aside:null__'),
      JSON.stringify(found),
      JSON.stringify('__cache-aside:null__')
    ])

    await expect(service.readThroughMany(keys, loader, options)).resolves.toEqual([null, found, null])
    expect(loader).toHaveBeenCalledTimes(1)
  })

  test('when null caching is disabled, should not cache null results', async () => {
    const keys = ['role:id:1']
    const loader = TestUtils.mockResolvedValue<Map<string, null>>(new Map())
    cache.mGet = TestUtils.mockResolvedValue<(string | null)[]>([null])
    cache.multiExec = TestUtils.mockResolvedValue<void>()

    await expect(service.readThroughMany(keys, loader, { ttlSeconds: 60 })).resolves.toEqual([null])
    expect(cache.multiExec).not.toHaveBeenCalled()

    cache.get = TestUtils.mockResolvedValue<string | null>(null)
    await expect(service.readThrough(keys[0], () => null, { ttlSeconds: 60 })).resolves.toBeNull()
    expect(cache.multiExec).not.toHaveBeenCalled()
  })

  test('when a batch loader returns undefined, should not cache that value', async () => {
    const key = 'role:id:missing'
    cache.mGet = TestUtils.mockResolvedValue<(string | null)[]>([null])
    cache.multiExec = TestUtils.mockResolvedValue<void>()

    await expect(
      service.readThroughMany([key], () => new Map<string, undefined>([[key, undefined]]), {
        ttlSeconds: 60,
        cacheNullResults: true
      })
    ).resolves.toEqual([null])

    expect(cache.multiExec).not.toHaveBeenCalled()
  })

  test('when single-flight cache options differ, should not share loader executions', async () => {
    const key = 'role:id:1'
    const loadResolvers: Array<(value: null) => void> = []
    let signalBothLoadersStarted: () => void = () => undefined
    const bothLoadersStarted = new Promise<void>((resolve) => {
      signalBothLoadersStarted = resolve
    })
    const loader = () =>
      new Promise<null>((resolve) => {
        loadResolvers.push(resolve)
        if (loadResolvers.length === 2) {
          signalBothLoadersStarted()
        }
      })

    cache.get = TestUtils.mockResolvedValue<string | null>(null)
    cache.multiExec = TestUtils.mockResolvedValue<void>()
    const applyTtl = TestUtils.spyOn(JitterUtils, 'applyTtl').mockImplementation((ttl) => ttl)

    const withoutNullCaching = service.readThroughSingleFlight(key, loader, { ttlSeconds: 60 })
    const withNullCaching = service.readThroughSingleFlight(key, loader, {
      ttlSeconds: 60,
      cacheNullResults: true,
      nullTtlSeconds: 10
    })

    await bothLoadersStarted
    expect(loadResolvers).toHaveLength(2)

    loadResolvers[0](null)
    loadResolvers[1](null)

    await expect(Promise.all([withoutNullCaching, withNullCaching])).resolves.toEqual([
      null,
      null
    ])
    expect(cache.multiExec).toHaveBeenCalledTimes(1)
    expect(applyTtl).toHaveBeenCalledWith(10)
  })

  test('when storing a loaded value fails, should still return the value', async () => {
    const loaded = { id: '1' }
    cache.get = TestUtils.mockResolvedValue<string>(null)
    cache.multiExec = TestUtils.mockRejectedValue<void>(new Error('Redis unavailable'))

    await expect(service.readThrough('role:id:1', () => loaded, { ttlSeconds: 60 })).resolves.toEqual(loaded)

    expect(logger.error).toHaveBeenCalledTimes(1)
  })

  test('when invalidation fails, should tolerate the cache error', async () => {
    cache.del = TestUtils.mockRejectedValue<void>(new Error('Redis unavailable'))
    cache.eval = TestUtils.mockRejectedValue<unknown>(new Error('Redis unavailable'))

    await expect(service.invalidate('role:id:1')).resolves.toBeUndefined()
    await expect(service.invalidateByTag('permission:id:1')).resolves.toBeUndefined()

    expect(logger.error).toHaveBeenCalledTimes(2)
  })

  test('when cached JSON is invalid, should warn and reload the value', async () => {
    const loaded = { id: '1' }
    cache.get = TestUtils.mockResolvedValue<string>('{invalid-json')
    cache.multiExec = TestUtils.mockResolvedValue<void>()

    await expect(service.readThrough('role:id:1', () => loaded, { ttlSeconds: 60 })).resolves.toEqual(loaded)

    expect(logger.warn).toHaveBeenCalledTimes(1)
    expect(cache.multiExec).toHaveBeenCalledTimes(1)
  })

  test('when a loader returns undefined, should omit it from cache writes', async () => {
    cache.get = TestUtils.mockResolvedValue<string>(null)
    cache.multiExec = TestUtils.mockResolvedValue<void>()

    await expect(service.readThrough('role:id:1', TestUtils.mockResolvedValue<undefined>(), { ttlSeconds: 60 })).resolves.toBeUndefined()

    expect(cache.multiExec).not.toHaveBeenCalled()
  })

  test('when writing cached values and tags, should use the jittered TTL', async () => {
    const applyTtl = TestUtils.spyOn(JitterUtils, 'applyTtl').mockImplementation((ttl) => ttl)
    cache.get = TestUtils.mockResolvedValue<string>(null)
    cache.multiExec = TestUtils.mockResolvedValue<void>()

    await service.readThrough('role:id:1', () => ({ id: '1' }), {
      ttlSeconds: 60,
      tags: [{ key: 'permission:id:1', ttlSeconds: 30 }]
    })

    expect(applyTtl).toHaveBeenNthCalledWith(1, 60)
    expect(applyTtl).toHaveBeenNthCalledWith(2, 30)
    expect(cache.multiExec).toHaveBeenCalledWith([
      ['set', 'role:id:1', JSON.stringify({ id: '1' }), 'PX', 60_000],
      ['hSet', 'cache-aside:tag:permission:id:1', 'role:id:1', '1'],
      ['pExpire', 'cache-aside:tag:permission:id:1', 30_000]
    ])
  })
})
