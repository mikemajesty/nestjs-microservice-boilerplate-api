import { SetMetadata } from '@nestjs/common';

import { UserRoleEnum } from '@/core/user/entity/user';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRoleEnum[]) => SetMetadata(ROLES_KEY, roles);
