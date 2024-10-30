import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { IUserRepository } from '@/core/user/repository/user';
import { PERMISSION_KEY } from '@/utils/decorators';
import { ApiUnauthorizedException } from '@/utils/exception';

@Injectable()
export class AuthRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly userRepository: IUserRepository
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

    const userId = request?.user?.id;

    if (!userId) {
      throw new ApiUnauthorizedException('userIdNotFoundInToken');
    }

    const user = await this.userRepository.findOneWithRelation({ id: userId }, { roles: true });

    if (!user) {
      throw new ApiUnauthorizedException('userNotFound');
    }

    const permissions = [];

    for (const role of user.roles) {
      permissions.push(...role.permissions.map((p) => p.name));
    }

    return new Set(permissions).has(requiredPermission);
  }
}
