/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/middlewares/authentication.guard.md
 */
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { ISessionAdapter } from '@/libs/session'
import { ITokenAdapter } from '@/libs/token'
import { PUBLIC_GUARD } from '@/utils/decorators'
import { ApiUnauthorizedException } from '@/utils/exception'
import { AppFastifyRequest, ensureTraceId, UserRequest } from '@/utils/request'

import { finishTracingWithError } from './utils'

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokenService: ITokenAdapter,
    private readonly session: ISessionAdapter
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AppFastifyRequest>()

    ensureTraceId(request)

    const tokenHeader = request.headers.authorization

    if (!tokenHeader) {
      return this.allowAnonymous(context, request)
    }

    await this.authenticate(request, tokenHeader)

    return true
  }

  private allowAnonymous(context: ExecutionContext, request: AppFastifyRequest): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_GUARD, [context.getHandler(), context.getClass()])

    if (!isPublic) {
      this.reject(request, 'no token provided')
    }

    return true
  }

  private async authenticate(request: AppFastifyRequest, tokenHeader: string): Promise<void> {
    const token = this.extractBearerToken(request, tokenHeader)

    const user = await this.verifyToken(request, token)

    await this.ensureActiveSession(request, user)

    request.user = user
  }

  private extractBearerToken(request: AppFastifyRequest, tokenHeader: string): string {
    const [scheme, token] = tokenHeader.trim().split(/\s+/)

    if (scheme !== 'Bearer' || !token) {
      this.reject(request, 'malformed authorization header')
    }

    return token
  }

  private async verifyToken(request: AppFastifyRequest, token: string): Promise<UserRequest> {
    try {
      return await this.tokenService.verify<UserRequest>({ token })
    } catch {
      this.reject(request, 'invalidToken')
    }
  }

  private async ensureActiveSession(request: AppFastifyRequest, user: UserRequest): Promise<void> {
    if (!user.sid) {
      this.reject(request, 'invalidToken')
    }

    const active = await this.isSessionActive(request, user)

    if (!active) {
      this.reject(request, 'you have been logged out')
    }
  }

  private async isSessionActive(request: AppFastifyRequest, user: UserRequest): Promise<boolean> {
    try {
      return await this.session.isActive({ userId: user.id, sessionId: user.sid })
    } catch {
      this.reject(request, 'unable to verify session')
    }
  }

  private reject(request: AppFastifyRequest, message: string): never {
    finishTracingWithError(request, ApiUnauthorizedException.STATUS, message)
    throw new ApiUnauthorizedException(message)
  }
}
