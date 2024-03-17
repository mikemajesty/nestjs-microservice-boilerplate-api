import { UserEntity, UserRole } from '@/core/user/entity/user';
import { UserCreateOutput } from '@/core/user/use-cases/user-create';
import { UserDeleteOutput } from '@/core/user/use-cases/user-delete';
import { UserGetByIdOutput } from '@/core/user/use-cases/user-get-by-id';
import { UserListOutput } from '@/core/user/use-cases/user-list';
import { UserUpdateOutput } from '@/core/user/use-cases/user-update';
import { getMockDate, getMockUUID } from '@/utils/tests';

const entity = {
  login: 'login',
  password: '**********',
  roles: [UserRole.USER]
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
  update: fullEntity as UserUpdateOutput,
  getByID: fullEntity as UserGetByIdOutput,
  list: { docs: [fullEntity], limit: 10, page: 1, total: 1 } as UserListOutput
};
