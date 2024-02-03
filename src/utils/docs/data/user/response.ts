import { UserEntity, UserRole } from '@/core/user/entity/user';
import { UserCreateOutput } from '@/core/user/use-cases/user-create';
import { UserDeleteOutput } from '@/core/user/use-cases/user-delete';
import { UserGetByIdOutput } from '@/core/user/use-cases/user-get-by-id';
import { UserListOutput } from '@/core/user/use-cases/user-list';
import { UserUpdateOutput } from '@/core/user/use-cases/user-update';
import { getMockUUID } from '@/utils/tests/tests';

const entity = new UserEntity({
  login: 'login',
  password: '**********',
  roles: [UserRole.USER]
});

const fullEntity = new UserEntity({
  ...entity,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null
});

export const UsersResponse = {
  create: { created: true, id: getMockUUID() } as UserCreateOutput,
  delete: { ...fullEntity, deletedAt: new Date() } as UserDeleteOutput,
  update: fullEntity as UserUpdateOutput,
  getByID: fullEntity as UserGetByIdOutput,
  list: { docs: [fullEntity], limit: 10, page: 1, total: 1 } as UserListOutput
};
