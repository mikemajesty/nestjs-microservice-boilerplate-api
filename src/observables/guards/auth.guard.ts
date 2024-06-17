import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { IRoleRepository } from '@/core/role/repository/role';
import { PERMISSION_KEY } from '@/utils/decorators';
import { ApiUnauthorizedException } from '@/utils/exception';

@Injectable()
export class AuthRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly roleRepository: IRoleRepository
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<string>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    const role = request?.user?.role;

    if (!role) {
      throw new ApiUnauthorizedException();
    }

    const permissions = await this.roleRepository.findWithCache(role);

    return permissions.includes(requiredPermission);
  }
}
