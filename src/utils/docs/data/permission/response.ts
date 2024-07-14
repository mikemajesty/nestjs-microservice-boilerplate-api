import { PermissionEntity } from '@/core/permission/entity/permission';
import { PermissionCreateOutput } from '@/core/permission/use-cases/permission-create';
import { PermissionDeleteOutput } from '@/core/permission/use-cases/permission-delete';
import { PermissionGetByIdOutput } from '@/core/permission/use-cases/permission-get-by-id';
import { PermissionListOutput } from '@/core/permission/use-cases/permission-list';
import { PermissionUpdateOutput } from '@/core/permission/use-cases/permission-update';
import { getMockDate, getMockUUID } from '@/utils/tests';

const permission = {
  id: getMockUUID(),
  name: 'name',
  createdAt: getMockDate(),
  deletedAt: null,
  updatedAt: getMockDate()
} as PermissionEntity;

export const PermissionResponse = {
  create: {
    name: 'name:permission',
    id: getMockUUID()
  } as PermissionCreateOutput,
  update: permission as PermissionUpdateOutput,
  delete: {
    ...permission,
    deletedAt: getMockDate()
  } as PermissionDeleteOutput,
  list: {
    docs: [permission],
    limit: 10,
    page: 1,
    total: 10
  } as PermissionListOutput,
  getById: permission as PermissionGetByIdOutput
};
