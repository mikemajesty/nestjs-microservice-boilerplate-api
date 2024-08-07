import { RoleEnum } from '@/core/role/entity/role';
import { UserEntity } from '@/core/user/entity/user';
import { UserCreateOutput } from '@/core/user/use-cases/user-create';
import { UserDeleteOutput } from '@/core/user/use-cases/user-delete';
import { UserGetByIdOutput } from '@/core/user/use-cases/user-get-by-id';
import { UserListOutput } from '@/core/user/use-cases/user-list';
import { UserUpdateOutput } from '@/core/user/use-cases/user-update';
import { UserRequest } from '@/utils/request';
import { getMockDate, getMockUUID } from '@/utils/tests';

const entity = {
  id: getMockUUID(),
  email: 'admin@admin.com',
  name: 'Admin',
  role: { name: RoleEnum.USER }
} as UserEntity;

const fullEntity = {
  ...entity,
  createdAt: getMockDate(),
  updatedAt: getMockDate(),
  deletedAt: null
} as UserEntity;

export const UsersResponse = {
  create: { created: true, id: getMockUUID() } as UserCreateOutput,
  delete: { ...fullEntity, deletedAt: getMockDate() } as UserDeleteOutput,
  update: { ...fullEntity } as UserUpdateOutput,
  getById: fullEntity as UserGetByIdOutput,
  list: { docs: [fullEntity], limit: 10, page: 1, total: 1 } as UserListOutput,
  me: { email: 'admin@admin.com', name: 'ADMIN', role: RoleEnum.USER } as UserRequest
};
