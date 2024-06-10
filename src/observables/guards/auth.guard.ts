import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { UserRoleEnum } from '@/core/user/entity/user';
import { ROLES_KEY } from '@/utils/decorators';

@Injectable()
export class AuthRoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRoleEnum[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    const roles = request?.user?.roles;

    if (!roles) {
      return true;
    }

    return requiredRoles.some((role) => roles.includes(role));
  }
}
