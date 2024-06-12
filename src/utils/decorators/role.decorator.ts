import { SetMetadata } from '@nestjs/common';

import { PermissionEnum } from '@/core/permission/entity/permission';

export const PERMISSION_KEY = 'permissions';
export const Permission = (...roles: PermissionEnum[] | string[]) => SetMetadata(PERMISSION_KEY, roles);
