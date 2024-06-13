import { PermissionCreateInput } from '@/core/permission/use-cases/permission-create';
import { PermissionUpdateInput } from '@/core/permission/use-cases/permission-update';
import { RoleEnum } from '@/core/role/entity/role';

export const PermissionRequest = {
  create: {
    name: 'Admin'
  } as PermissionCreateInput,
  update: {
    name: 'Admin',
    role: RoleEnum.USER
  } as PermissionUpdateInput
};
