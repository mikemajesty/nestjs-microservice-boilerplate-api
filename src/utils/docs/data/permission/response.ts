import { PermissionEntity } from '@/core/permission/entity/permission';
import { PermissionCreateOutput } from '@/core/permission/use-cases/permission-create';
import { PermissionDeleteOutput } from '@/core/permission/use-cases/permission-delete';
import { PermissionGetByIdOutput } from '@/core/permission/use-cases/permission-get-by-id';
import { PermissionListOutput } from '@/core/permission/use-cases/permission-list';
import { PermissionUpdateOutput } from '@/core/permission/use-cases/permission-update';
import { TestUtils } from '@/utils/tests';

const permission = {
  id: TestUtils.getMockUUID(),
  name: 'name',
  createdAt: TestUtils.getMockDate(),
  deletedAt: null,
  updatedAt: TestUtils.getMockDate()
} as PermissionEntity;

export const PermissionResponse = {
  create: {
    name: 'name:permission',
    id: TestUtils.getMockUUID()
  } as PermissionCreateOutput,
  update: permission as PermissionUpdateOutput,
  delete: {
    ...permission,
    deletedAt: TestUtils.getMockDate()
  } as PermissionDeleteOutput,
  list: {
    docs: [permission],
    limit: 10,
    page: 1,
    total: 10
  } as PermissionListOutput,
  getById: permission as PermissionGetByIdOutput
};
