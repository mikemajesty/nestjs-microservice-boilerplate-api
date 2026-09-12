/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/middlewares/authorization.guard.md
 */
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { SpanStatusCode, trace } from '@opentelemetry/api'

import { IUserRepository } from '@/core/user/repository/user'
import { ICacheAdapter } from '@/infra/cache'
import { ITokenAdapter } from '@/libs/token'
import { PERMISSION_GUARD, PUBLIC_GUARD } from '@/utils/decorators'
import { ApiForbiddenException, ApiUnauthorizedException } from '@/utils/exception'
import { DefaultErrorMessage } from '@/utils/http-status'
import { ObjectUtils } from '@/utils/object'
import { AppFastifyRequest, ensureTraceId, generalizePath, UserRequest } from '@/utils/request'

import { name, version } from '../../../package.json'

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

    ensureTraceId(request)

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

    const userId = ObjectUtils.reach(request, (o) => o.user.id)

    if (!userId) {
      this.finishTracing(request, ApiUnauthorizedException.STATUS, 'invalidToken')
      throw new ApiUnauthorizedException('invalidToken')
    }

    const user = await this.userRepository.findOneWithRelation({ id: userId }, { roles: true })

    if (!user) {
      this.finishTracing(request, ApiUnauthorizedException.STATUS, 'userNotFound')
      throw new ApiUnauthorizedException('userNotFound')
    }

    const permissions = []

    for (const role of user.roles) {
      permissions.push(...role.permissions.map((p) => p.name))
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

  private finishTracing(request: AppFastifyRequest, status: number, message: string) {
    if (request?.tracing) {
      request.tracing.addAttribute('http.status_code', status)
      request.tracing.addAttribute('error.message', message)
      request.tracing.setStatus({ message, code: SpanStatusCode.ERROR })
      request.tracing.finish()
      return
    }

    const span = trace.getTracer(name, version).startSpan(generalizePath(request.url?.split('?')[0] || '/'))

    span.setAttribute('http.status_code', status)
    if (request.headers.traceid) {
      span.setAttribute('traceid', request.headers.traceid)
    }
    span.setAttribute('error.message', message)
    span.setStatus({ message, code: SpanStatusCode.ERROR })
    span.end()
  }
}
