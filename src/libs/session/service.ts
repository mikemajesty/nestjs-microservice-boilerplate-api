/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/libs/session.md
 */
import { Redis } from 'ioredis'

import { UserEntity } from '@/core/user/entity/user'
import { ICacheAdapter } from '@/infra/cache'
import { ITokenAdapter } from '@/libs/token'
import { ApiUnauthorizedException } from '@/utils/exception'
import { IDGeneratorUtils } from '@/utils/id-generator'
import { Namespaces } from '@/utils/namespaces'
import { UserRequest } from '@/utils/request'

import { ISessionAdapter } from './adapter'

/**
 * One Redis key per login session: `auth:session:<userId>:<sessionId>` = current refresh token id (jti).
 * The key TTL is the refresh token lifetime, so Redis expires sessions on its own.
 *
 * Swaps the stored jti only if it matches the presented one, atomically, so two refreshes
 * racing with the same token cannot both succeed. A mismatch means an old refresh token was
 * reused (likely stolen): the session is deleted.
 * KEYS[1] = session key; ARGV = presented jti, next jti, ttl in seconds. Returns a RotateResult.
 */
enum RotateResult {
  ROTATED = 1,
  /** Expired, logged out or revoked. */
  SESSION_NOT_FOUND = 0,
  /** An already rotated refresh token was presented again: the session was deleted. */
  REUSE_DETECTED = -1
}

const ROTATE_SCRIPT = `
local current = redis.call('GET', KEYS[1])
if not current then return ${RotateResult.SESSION_NOT_FOUND} end
if current ~= ARGV[1] then redis.call('DEL', KEYS[1]) return ${RotateResult.REUSE_DETECTED} end
redis.call('SET', KEYS[1], ARGV[2], 'EX', ARGV[3])
return ${RotateResult.ROTATED}
`

export class SessionService implements ISessionAdapter {
  constructor(
    private readonly token: ITokenAdapter,
    private readonly cache: ICacheAdapter<Redis>
  ) {}

  async start(user: SessionUser): Promise<SessionStartOutput> {
    const sessionId = IDGeneratorUtils.uuid()
    const tokenId = IDGeneratorUtils.uuid()

    await this.cache.set(Namespaces.session(user.id, sessionId), tokenId, {
      EX: this.token.refreshExpiration
    })

    return this.sign({ user, sessionId, tokenId })
  }

  async rotate({ refreshToken, loadUser }: SessionRotateInput): Promise<SessionRotateOutput> {
    const payload = await this.verifyRefreshToken(refreshToken)
    const nextTokenId = IDGeneratorUtils.uuid()

    const result = await this.cache.eval({
      script: ROTATE_SCRIPT,
      keys: [Namespaces.session(payload.userId, payload.sid)],
      args: [payload.jti, nextTokenId, this.token.refreshExpiration]
    })

    const rotated = Number(result) === RotateResult.ROTATED

    if (!rotated) {
      throw new ApiUnauthorizedException('invalidRefreshToken')
    }

    const user = await loadUser(payload.userId)
    return this.sign({ user, sessionId: payload.sid, tokenId: nextTokenId })
  }

  async isActive({ userId, sessionId }: SessionIsActiveInput): Promise<SessionIsActiveOutput> {
    return this.cache.has(Namespaces.session(userId, sessionId))
  }

  async revoke({ userId, sessionId }: SessionRevokeInput): Promise<SessionRevokeOutput> {
    await this.cache.del(Namespaces.session(userId, sessionId))
  }

  async revokeAll(userId: string): Promise<SessionRevokeAllOutput> {
    const stream = this.cache.client.scanStream({ match: Namespaces.sessionsOf(userId), count: 100 })
    for await (const keys of stream as AsyncIterable<string[]>) {
      await this.cache.del(keys)
    }
  }

  private sign({ user, sessionId, tokenId }: SessionSignInput): SessionTokens {
    const access: UserRequest = { id: user.id, email: user.email, name: user.name, sid: sessionId }
    const { token: accessToken } = this.token.sign({ body: access })

    const refresh: RefreshTokenPayload = { userId: user.id, sid: sessionId, jti: tokenId }
    const { token: refreshToken } = this.token.sign({
      body: refresh,
      secret: this.token.refreshSecret,
      options: { expiresIn: this.token.refreshExpiration }
    })

    return { accessToken, refreshToken }
  }

  private verifyRefreshToken(refreshToken: string): Promise<RefreshTokenPayload> {
    return this.token.verify<RefreshTokenPayload>({ token: refreshToken, secret: this.token.refreshSecret })
  }
}

export type SessionUser = Pick<UserEntity, 'id' | 'email' | 'name'>

export type SessionTokens = { accessToken: string; refreshToken: string }

export type SessionStartOutput = SessionTokens

export type SessionRotateInput = {
  refreshToken: string
  loadUser: (userId: string) => Promise<SessionUser>
}
export type SessionRotateOutput = SessionTokens

export type SessionIsActiveInput = SessionKey
export type SessionIsActiveOutput = boolean

export type SessionRevokeInput = SessionKey
export type SessionRevokeOutput = void

export type SessionRevokeAllOutput = void

type SessionSignInput = {
  user: SessionUser
  sessionId: string
  tokenId: string
}

export type RefreshTokenPayload = {
  userId: string
  sid: string
  jti: string
}

type SessionKey = {
  userId: string
  sessionId: string
}
