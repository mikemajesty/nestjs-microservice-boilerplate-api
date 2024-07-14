import { PermissionCreateInput } from '@/core/permission/use-cases/permission-create';
import { PermissionUpdateInput } from '@/core/permission/use-cases/permission-update';

export const PermissionRequest = {
  create: {
    name: 'Admin'
  } as PermissionCreateInput,
  update: {
    name: 'Admin'
  } as PermissionUpdateInput
};
