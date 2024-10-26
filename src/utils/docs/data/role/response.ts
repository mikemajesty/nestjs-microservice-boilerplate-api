import { RoleEntity, RoleEnum } from '@/core/role/entity/role';
import { RoleCreateOutput } from '@/core/role/use-cases/role-create';
import { RoleDeleteOutput } from '@/core/role/use-cases/role-delete';
import { RoleGetByIdOutput } from '@/core/role/use-cases/role-get-by-id';
import { RoleListOutput } from '@/core/role/use-cases/role-list';
import { RoleUpdateOutput } from '@/core/role/use-cases/role-update';
import { TestUtils } from '@/utils/tests';

const role = {
  id: TestUtils.getMockUUID(),
  name: RoleEnum.USER,
  createdAt: TestUtils.getMockDate(),
  deletedAt: null,
  updatedAt: TestUtils.getMockDate()
} as RoleEntity;

export const RoleResponse = {
  create: {
    created: true,
    id: TestUtils.getMockUUID()
  } as RoleCreateOutput,
  update: role as RoleUpdateOutput,
  delete: {
    ...role,
    deletedAt: TestUtils.getMockDate()
  } as RoleDeleteOutput,
  list: {
    docs: [role],
    limit: 10,
    page: 1,
    total: 10
  } as RoleListOutput,
  getById: role as RoleGetByIdOutput
};
