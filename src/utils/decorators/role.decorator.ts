import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'permissions';
export const Permission = (...roles: string[]) => SetMetadata(PERMISSION_KEY, roles);
