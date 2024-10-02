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

    const roles = request?.user?.roles;

    if (!roles?.length) {
      throw new ApiUnauthorizedException('userRoleNotFound');
    }

    const rolesData = await this.roleRepository.findIn({ name: roles });

    const permissions = [];

    for (const permission of new Set(rolesData.map((role) => role.permissions).flat())) {
      permissions.push(permission.name);
    }

    return permissions.includes(requiredPermission);
  }
}
