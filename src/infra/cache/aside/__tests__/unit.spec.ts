import { ICacheAdapter } from '@/infra/cache'
import { ILoggerAdapter } from '@/infra/logger'
import { JitterUtils } from '@/utils/jitter'
import { TestUtils } from '@/utils/test/utils'

import { CacheAsideService } from '../service'

describe(CacheAsideService.name, () => {
  const logger = {
    debug: TestUtils.mock(),
    error: TestUtils.mock(),
    warn: TestUtils.mock()
  } as Partial<ILoggerAdapter> as ILoggerAdapter

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

  it('should recover from a cache read failure by loading and storing the value', async () => {
    const loaded = { id: '1' }
    const loader = TestUtils.mockResolvedValue<typeof loaded>(loaded)
    cache.get = TestUtils.mockRejectedValue<string | null>(new Error('Redis unavailable'))
    cache.multiExec = TestUtils.mockResolvedValue<void>()

    await expect(service.readThrough('role:id:1', loader, { ttlSeconds: 60 })).resolves.toEqual(loaded)

    expect(loader).toHaveBeenCalledTimes(1)
    expect(cache.multiExec).toHaveBeenCalledTimes(1)
    expect(logger.error).toHaveBeenCalledTimes(1)
  })

  it('should recover from an MGET failure by loading all requested keys', async () => {
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

  it('should return the loaded value when storing it fails', async () => {
    const loaded = { id: '1' }
    cache.get = TestUtils.mockResolvedValue<string>(null)
    cache.multiExec = TestUtils.mockRejectedValue<void>(new Error('Redis unavailable'))

    await expect(service.readThrough('role:id:1', () => loaded, { ttlSeconds: 60 })).resolves.toEqual(loaded)

    expect(logger.error).toHaveBeenCalledTimes(1)
  })

  it('should tolerate invalidation failures', async () => {
    cache.del = TestUtils.mockRejectedValue<void>(new Error('Redis unavailable'))
    cache.eval = TestUtils.mockRejectedValue<unknown>(new Error('Redis unavailable'))

    await expect(service.invalidate('role:id:1')).resolves.toBeUndefined()
    await expect(service.invalidateByTag('permission:id:1')).resolves.toBeUndefined()

    expect(logger.error).toHaveBeenCalledTimes(2)
  })

  it('should treat invalid JSON as a cache miss and warn before reloading', async () => {
    const loaded = { id: '1' }
    cache.get = TestUtils.mockResolvedValue<string>('{invalid-json')
    cache.multiExec = TestUtils.mockResolvedValue<void>()

    await expect(service.readThrough('role:id:1', () => loaded, { ttlSeconds: 60 })).resolves.toEqual(loaded)

    expect(logger.warn).toHaveBeenCalledTimes(1)
    expect(cache.multiExec).toHaveBeenCalledTimes(1)
  })

  it('should omit undefined values from cache writes', async () => {
    cache.get = TestUtils.mockResolvedValue<string>(null)
    cache.multiExec = TestUtils.mockResolvedValue<void>()

    await expect(service.readThrough('role:id:1', TestUtils.mockResolvedValue<undefined>(), { ttlSeconds: 60 })).resolves.toBeUndefined()

    expect(cache.multiExec).not.toHaveBeenCalled()
  })

  it('should use the jittered TTL in cache and tag commands', async () => {
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
