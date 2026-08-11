/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/middlewares/authorization.guard.md
 */
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Cached } from '@nestjs-redisx/cache'
import { SpanStatusCode } from '@opentelemetry/api'

import { IUserRepository } from '@/core/user/repository/user'
import {
  ICacheAdapter,
  USER_PERMISSIONS_CACHE_TAG,
  USER_PERMISSIONS_CACHE_TTL_IN_SECONDS,
  userCacheTag
} from '@/infra/cache'
import { ITokenAdapter } from '@/libs/token'
import { PERMISSION_GUARD, PUBLIC_GUARD } from '@/utils/decorators'
import { ApiForbiddenException, ApiUnauthorizedException } from '@/utils/exception'
import { DefaultErrorMessage } from '@/utils/http-status'
import { IDGeneratorUtils } from '@/utils/id-generator'
import { ObjectUtil } from '@/utils/object'
import { AppFastifyRequest, TracingType, UserRequest } from '@/utils/request'

@Injectable()
export class AuthorizationRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly userRepository: IUserRepository,
    private readonly tokenService: ITokenAdapter,
    private readonly redisService: ICacheAdapter
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_GUARD, [context.getHandler(), context.getClass()])

    if (isPublic) {
      return true
    }

    const requiredPermission = this.reflector.getAllAndOverride<string>(PERMISSION_GUARD, [
      context.getHandler(),
      context.getClass()
    ])
    const request = context.switchToHttp().getRequest<AppFastifyRequest>()
    const tokenHeader = request.headers.authorization

    if (!request.headers?.traceid) {
      request.headers.traceid = request.id || IDGeneratorUtils.uuid()
    }

    request.id = request.headers.traceid as string

    if (!tokenHeader) {
      this.finishTracing(request, ApiUnauthorizedException.STATUS, 'no token provided')
      throw new ApiUnauthorizedException('no token provided')
    }

    const token = tokenHeader.split(' ')[1] || ''
    const blackListToken = await this.redisService.get(token)

    if (blackListToken) {
      this.finishTracing(request, ApiUnauthorizedException.STATUS, 'you have been logged out')
      throw new ApiUnauthorizedException('you have been logged out')
    }

    request.user = (await this.tokenService.verify<UserRequest>({ token }).catch((error) => {
      error.status = ApiUnauthorizedException.STATUS
      this.finishTracing(request, ApiUnauthorizedException.STATUS, 'invalidToken')
      throw error
    })) as UserRequest

    if (!requiredPermission) {
      return true
    }

    const userId = ObjectUtil.reach(request, (o) => o.user.id)

    if (!userId) {
      this.finishTracing(request, ApiUnauthorizedException.STATUS, 'invalidToken')
      throw new ApiUnauthorizedException('invalidToken')
    }

    const permissions = await this.findUserPermissions(userId)

    if (!permissions) {
      this.finishTracing(request, ApiUnauthorizedException.STATUS, 'userNotFound')
      throw new ApiUnauthorizedException('userNotFound')
    }

    const hasPermission = new Set(permissions).has(requiredPermission)

    if (!hasPermission) {
      const appContext = `${context.getClass().name}/${context.getHandler().name}`
      const permission = this.reflector.get(PERMISSION_GUARD, context.getHandler())
      this.finishTracing(request, ApiForbiddenException.STATUS, ApiForbiddenException.name)
      throw new ApiForbiddenException(DefaultErrorMessage[ApiForbiddenException.STATUS], {
        context: appContext,
        parameters: { permission }
      })
    }

    return true
  }

  /**
   * Permission names of a user, or null when the user no longer exists.
   *
   * Only the names are cached, never the user entity, so no credential ever
   * reaches Redis. `{0}` is the userId argument.
   */
  @Cached({
    key: 'user:permissions:{0}',
    ttl: USER_PERMISSIONS_CACHE_TTL_IN_SECONDS,
    tags: [userCacheTag('{0}'), USER_PERMISSIONS_CACHE_TAG]
  })
  private async findUserPermissions(userId: string): Promise<string[] | null> {
    const user = await this.userRepository.findOneWithRelation({ id: userId }, { roles: true })

    if (!user) {
      return null
    }

    return user.roles.flatMap((role) => role.permissions.map((permission) => permission.name))
  }

  private finishTracing(request: { tracing?: TracingType }, status: number, message: string) {
    if (request?.tracing) {
      request.tracing.addAttribute('http.status_code', status)
      request.tracing.setStatus({ message, code: SpanStatusCode.ERROR })
      request.tracing.finish()
    }
  }
}
