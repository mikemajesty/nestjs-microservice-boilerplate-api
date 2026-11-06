/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/tests/standards.md
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/infra/distributed-lock.md
 */

import { ICacheAdapter } from '@/infra/cache'
import { TestRedisContainer } from '@/utils/test/e2e/containers'

import { DistributedLockService } from '../service'

describe(DistributedLockService.name, () => {
  const redisContainer = new TestRedisContainer()
  let cache: ICacheAdapter
  let service: DistributedLockService

  beforeAll(async () => {
    cache = await redisContainer.getTestRedis()
    service = new DistributedLockService(cache)
  })

  afterEach(async () => {
    await redisContainer.client.flushdb()
  })

  afterAll(async () => {
    await redisContainer.close()
  })

  test('when releasing and reacquiring a lock, should return an increasing fencing token', async () => {
    const input = { key: 'job:integration', ttlSeconds: 30 }
    const acquired = await service.tryAcquireLock(input)

    expect(acquired).toEqual({
      fencingToken: expect.any(String),
      release: expect.any(Function)
    })
    await expect(service.tryAcquireLock(input)).resolves.toBeNull()

    await expect(acquired!.release()).resolves.toBeUndefined()

    const reacquired = await service.tryAcquireLock(input)
    expect(reacquired).toEqual({
      fencingToken: expect.any(String),
      release: expect.any(Function)
    })
    expect(BigInt(reacquired!.fencingToken)).toBeGreaterThan(BigInt(acquired!.fencingToken))
    await reacquired!.release()
  })

  test('when another owner replaces the lock token, should not release that lock', async () => {
    const key = 'distributed-lock:{am9iOm93bmVyc2hpcA}:lock'
    const acquired = await service.tryAcquireLock({ key: 'job:ownership', ttlSeconds: 30 })
    expect(acquired).not.toBeNull()

    await redisContainer.client.set(key, 'another-owner', 'EX', 30)
    await acquired!.release()

    await expect(redisContainer.client.get(key)).resolves.toBe('another-owner')
  })

  test('when callers acquire the same lock concurrently, should allow only one to acquire it', async () => {
    const attempts = await Promise.all(
      Array.from({ length: 10 }, () => service.tryAcquireLock({ key: 'job:concurrent', ttlSeconds: 30 }))
    )
    const acquired = attempts.filter((attempt) => attempt !== null)

    expect(acquired).toHaveLength(1)
    await acquired[0]!.release()
  })
})
