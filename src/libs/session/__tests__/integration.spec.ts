/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/tests/standards.md
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/libs/session.md
 */
import { Redis } from 'ioredis'

import { ICacheAdapter } from '@/infra/cache'
import { ISecretsAdapter } from '@/infra/secrets'
import { TokenService } from '@/libs/token'
import { ApiUnauthorizedException } from '@/utils/exception'
import { Namespaces } from '@/utils/namespaces'
import { MockUtils } from '@/utils/test'
import { TestRedisContainer } from '@/utils/test/e2e'

import { SessionService, SessionUser } from '../service'

describe(SessionService.name, () => {
  const redisContainer = new TestRedisContainer()
  const token = new TokenService({
    JWT_SECRET_KEY: 'access-secret',
    JWT_REFRESH_SECRET_KEY: 'refresh-secret',
    TOKEN_EXPIRATION: 300,
    REFRESH_TOKEN_EXPIRATION: 600
  } as ISecretsAdapter)
  let cache: ICacheAdapter<Redis>
  let service: SessionService

  const user: SessionUser = { id: MockUtils.UUID(), email: 'user@test.com', name: 'User' }
  const loadUser = async () => user
  const sidOf = (accessToken: string) => token.decode<{ sid: string }>({ token: accessToken }).sid

  beforeAll(async () => {
    cache = (await redisContainer.getTestRedis()) as ICacheAdapter<Redis>
    service = new SessionService(token, cache)
  })

  afterEach(async () => {
    await redisContainer.client.flushdb()
  })

  afterAll(async () => {
    await redisContainer.close()
  })

  test('when a session starts, should be active and expire with the refresh token', async () => {
    const { accessToken } = await service.start(user)
    const sid = sidOf(accessToken)

    await expect(service.isActive({ userId: user.id, sessionId: sid })).resolves.toBe(true)
    const ttl = await redisContainer.client.ttl(Namespaces.session(user.id, sid))
    expect(ttl).toBeGreaterThan(590)
    expect(ttl).toBeLessThanOrEqual(600)
  })

  test('when two refreshes race with the same token, should let only one succeed', async () => {
    const { refreshToken } = await service.start(user)

    const results = await Promise.allSettled([
      service.rotate({ refreshToken, loadUser }),
      service.rotate({ refreshToken, loadUser })
    ])

    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1)
    expect(results.filter((r) => r.status === 'rejected')).toHaveLength(1)
  })

  test('when the user is revoked everywhere, should end every session of that user only', async () => {
    const laptop = await service.start(user)
    const phone = await service.start(user)
    const otherUser = { ...user, id: MockUtils.UUID() }
    const other = await service.start(otherUser)

    await service.revokeAll(user.id)

    await expect(service.isActive({ userId: user.id, sessionId: sidOf(laptop.accessToken) })).resolves.toBe(false)
    await expect(service.isActive({ userId: user.id, sessionId: sidOf(phone.accessToken) })).resolves.toBe(false)
    await expect(service.rotate({ refreshToken: laptop.refreshToken, loadUser })).rejects.toThrow(
      ApiUnauthorizedException
    )
    await expect(service.isActive({ userId: otherUser.id, sessionId: sidOf(other.accessToken) })).resolves.toBe(true)
  })
})
