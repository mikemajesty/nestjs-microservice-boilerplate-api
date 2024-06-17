import { RoleEnum } from '@/core/role/entity/role';
import { RoleAddPermissionInput } from '@/core/role/use-cases/role-add-permission';
import { RoleCreateInput } from '@/core/role/use-cases/role-create';
import { RoleDeletePermissionInput } from '@/core/role/use-cases/role-delete-permission';
import { RoleUpdateInput } from '@/core/role/use-cases/role-update';

export const RoleRequest = {
  create: {
    name: RoleEnum.USER
  } as RoleCreateInput,
  update: {
    name: RoleEnum.USER
  } as RoleUpdateInput,
  addPermission: {
    permissions: ['permission']
  } as RoleAddPermissionInput,
  deletePermission: {
    permissions: ['permission']
  } as RoleDeletePermissionInput
};
