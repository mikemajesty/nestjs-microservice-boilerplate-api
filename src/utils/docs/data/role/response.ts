import { RoleEntity, RoleEnum } from '@/core/role/entity/role';
import { RoleCreateOutput } from '@/core/role/use-cases/role-create';
import { RoleDeleteOutput } from '@/core/role/use-cases/role-delete';
import { RoleGetByIdOutput } from '@/core/role/use-cases/role-get-by-id';
import { RoleListOutput } from '@/core/role/use-cases/role-list';
import { RoleUpdateOutput } from '@/core/role/use-cases/role-update';
import { getMockDate, getMockUUID } from '@/utils/tests';

const role = {
  id: getMockUUID(),
  name: RoleEnum.USER,
  createdAt: getMockDate(),
  deletedAt: null,
  updatedAt: getMockDate()
} as RoleEntity;

export const RoleResponse = {
  create: {
    created: true,
    id: getMockUUID()
  } as RoleCreateOutput,
  update: role as RoleUpdateOutput,
  delete: {
    ...role,
    deletedAt: getMockDate()
  } as RoleDeleteOutput,
  list: {
    docs: [role],
    limit: 10,
    page: 1,
    total: 10
  } as RoleListOutput,
  getById: role as RoleGetByIdOutput
};
