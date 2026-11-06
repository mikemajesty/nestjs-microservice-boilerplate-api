/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/tests/standards.md
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/infra/distributed-lock.md
 */

import { ICacheAdapter } from '@/infra/cache'
import { TestUtils } from '@/utils/test'

import { DistributedLockService } from '../service'

describe(DistributedLockService.name, () => {
  let service: DistributedLockService
  let evalScript: jest.Mock<Promise<unknown>>

  beforeEach(() => {
    evalScript = TestUtils.mockResolvedValue<unknown>('1')
    const cache = { client: { eval: evalScript } } as Partial<ICacheAdapter> as ICacheAdapter
    service = new DistributedLockService(cache)
  })

  afterEach(() => {
    TestUtils.restoreMocks()
    TestUtils.clearMocks()
  })

  test('when a lock is available, should acquire it and return its fencing token and release function', async () => {
    const acquired = await service.tryAcquireLock({ key: 'job:1', ttlSeconds: 30 })

    expect(acquired).toEqual({ fencingToken: '1', release: expect.any(Function) })
    expect(evalScript).toHaveBeenCalledWith(
      expect.any(String),
      2,
      'distributed-lock:{am9iOjE}:lock',
      'distributed-lock:{am9iOjE}:fence',
      expect.any(String),
      30
    )
  })

  test('when the lock is already held, should return null', async () => {
    evalScript.mockResolvedValue(null)

    await expect(service.tryAcquireLock({ key: 'job:1', ttlSeconds: 30 })).resolves.toBeNull()
    expect(evalScript).toHaveBeenCalledTimes(1)
  })

  test('when releasing an acquired lock, should use its owner token', async () => {
    const acquired = await service.tryAcquireLock({ key: 'job:1', ttlSeconds: 30 })
    expect(acquired).not.toBeNull()

    await acquired!.release()

    const [, , , , ownerToken] = evalScript.mock.calls[0]
    expect(evalScript).toHaveBeenNthCalledWith(2, expect.any(String), 1, 'distributed-lock:{am9iOjE}:lock', ownerToken)
  })

  test('when lock parameters are invalid, should throw without evaluating the script', async () => {
    expect(() => service.tryAcquireLock({ key: 'job:1', ttlSeconds: 0 })).toThrow()
    expect(evalScript).not.toHaveBeenCalled()
  })

  test.each(['', '   '])('when the lock key is empty after trimming "%s", should reject it', (key) => {
    expect(() => service.tryAcquireLock({ key, ttlSeconds: 30 })).toThrow()
    expect(evalScript).not.toHaveBeenCalled()
  })
})
