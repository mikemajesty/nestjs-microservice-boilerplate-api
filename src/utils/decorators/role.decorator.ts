import { SetMetadata } from '@nestjs/common';

import { ApiInternalServerException } from '../exception';

export const PERMISSION_GUARD = 'permissions';
export const Permission = (permission: string) => {
  const permissionSanitize = permission.toLowerCase();

  if (!permissionSanitize.includes(':')) {
    throw new ApiInternalServerException(`permission: ${permission} must contain ":", example: user:create`);
  }

  return SetMetadata(PERMISSION_GUARD, permissionSanitize);
};
