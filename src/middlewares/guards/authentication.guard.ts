/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/middlewares/authentication.guard.md
 */
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { ICacheAdapter } from '@/infra/cache'
import { ITokenAdapter } from '@/libs/token'
import { PUBLIC_GUARD } from '@/utils/decorators'
import { ApiUnauthorizedException } from '@/utils/exception'
import { Namespaces } from '@/utils/namespaces'
import { ObjectUtils } from '@/utils/object'
import { AppFastifyRequest, ensureTraceId, UserRequest } from '@/utils/request'

import { finishTracing } from './utils'

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokenService: ITokenAdapter,
    private readonly redisService: ICacheAdapter
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AppFastifyRequest>()

    ensureTraceId(request)

    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_GUARD, [context.getHandler(), context.getClass()])

    const tokenHeader = request.headers.authorization

    if (isPublic) {
      if (tokenHeader) {
        await this.validateToken(request, tokenHeader)
        await this.ensureNotBlacklisted(request)
      }
      return true
    }

    if (!tokenHeader) {
      finishTracing(request, ApiUnauthorizedException.STATUS, 'no token provided')
      throw new ApiUnauthorizedException('no token provided')
    }

    await this.validateToken(request, tokenHeader)
    await this.ensureNotBlacklisted(request)

    return true
  }

  private async validateToken(request: AppFastifyRequest, tokenHeader: string) {
    const [scheme, token] = tokenHeader.trim().split(/\s+/)

    if (scheme !== 'Bearer' || !token) {
      finishTracing(request, ApiUnauthorizedException.STATUS, 'malformed authorization header')
      throw new ApiUnauthorizedException('malformed authorization header')
    }

    try {
      request.user = await this.tokenService.verify<UserRequest>({ token })
    } catch {
      finishTracing(request, ApiUnauthorizedException.STATUS, 'invalidToken')
      throw new ApiUnauthorizedException('invalidToken')
    }
  }

  private async ensureNotBlacklisted(request: AppFastifyRequest) {
    const userId = ObjectUtils.reach(request, (r) => r.user.id)

    if (!userId) {
      finishTracing(request, ApiUnauthorizedException.STATUS, 'invalidToken')
      throw new ApiUnauthorizedException('invalidToken')
    }

    const key = Namespaces.blacklist(userId)

    const blackListToken: unknown = await this.getBlackListToken(key, request)

    if (blackListToken) {
      finishTracing(request, ApiUnauthorizedException.STATUS, 'you have been logged out')
      throw new ApiUnauthorizedException('you have been logged out')
    }
  }

  private async getBlackListToken(key: string, request: AppFastifyRequest) {
    try {
      const blackListToken = await this.redisService.get(key)
      return blackListToken
    } catch {
      finishTracing(request, ApiUnauthorizedException.STATUS, 'unable to verify session')
      throw new ApiUnauthorizedException('unable to verify session')
    }
  }
}
