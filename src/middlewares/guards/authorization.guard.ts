import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SpanStatusCode } from '@opentelemetry/api';

import { IUserRepository } from '@/core/user/repository/user';
import { PERMISSION_GUARD } from '@/utils/decorators';
import { ApiForbiddenException, ApiUnauthorizedException } from '@/utils/exception';
import { DefaultErrorMessage } from '@/utils/http-status';
import { TracingType } from '@/utils/request';

@Injectable()
export class AuthorizationRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly userRepository: IUserRepository
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<string>(PERMISSION_GUARD, [
      context.getHandler(),
      context.getClass()
    ]);

    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    const userId = request?.user?.id;

    if (!userId) {
      this.finishTracing(request, ApiUnauthorizedException.STATUS, 'invalidToken');
      throw new ApiUnauthorizedException('invalidToken');
    }

    const user = await this.userRepository.findOneWithRelation({ id: userId }, { roles: true });

    if (!user) {
      this.finishTracing(request, ApiUnauthorizedException.STATUS, 'userNotFound');
      throw new ApiUnauthorizedException('userNotFound');
    }

    const permissions = [];

    for (const role of user.roles) {
      permissions.push(...role.permissions.map((p) => p.name));
    }

    const hasPermission = new Set(permissions).has(requiredPermission);

    if (!hasPermission) {
      const appContext = `${context.getClass().name}/${context.getHandler().name}`;
      const permission = this.reflector.get(PERMISSION_GUARD, context.getHandler());
      this.finishTracing(request, ApiForbiddenException.STATUS, ApiForbiddenException.name);
      throw new ApiForbiddenException(DefaultErrorMessage[ApiForbiddenException.STATUS], {
        context: appContext,
        parameters: { permission }
      });
    }

    return true;
  }

  private finishTracing(request: { tracing?: TracingType }, status: number, message: string) {
    if (request?.tracing) {
      request.tracing.addAttribute('http.status_code', status);
      request.tracing.setStatus({ message, code: SpanStatusCode.ERROR });
      request.tracing.finish();
    }
  }
}
