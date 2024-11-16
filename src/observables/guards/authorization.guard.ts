import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { IUserRepository } from '@/core/user/repository/user';
import { PERMISSION_GUARD } from '@/utils/decorators';
import { ApiForbiddenException, ApiUnauthorizedException } from '@/utils/exception';
import { DefaultErrorMessage } from '@/utils/http-status';

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
      throw new ApiUnauthorizedException('invalidToken');
    }

    const user = await this.userRepository.findOneWithRelation({ id: userId }, { roles: true });

    if (!user) {
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
      throw new ApiForbiddenException(DefaultErrorMessage[ApiForbiddenException.STATUS], {
        context: appContext,
        parameters: { permission }
      });
    }

    return true;
  }
}
