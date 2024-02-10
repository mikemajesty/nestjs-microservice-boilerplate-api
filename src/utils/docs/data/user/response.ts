import { UserEntity, UserRole } from '@/core/user/entity/user';
import { UserCreateOutput } from '@/core/user/use-cases/user-create';
import { UserDeleteOutput } from '@/core/user/use-cases/user-delete';
import { UserGetByIdOutput } from '@/core/user/use-cases/user-get-by-id';
import { UserListOutput } from '@/core/user/use-cases/user-list';
import { UserUpdateOutput } from '@/core/user/use-cases/user-update';
import { GET_MOCK_DATE } from '@/utils/tests/mocks/date';
import { getMockUUID } from '@/utils/tests/tests';

const entity = new UserEntity({
  login: 'login',
  password: '**********',
  roles: [UserRole.USER]
});

const fullEntity = new UserEntity({
  ...entity,
  createdAt: GET_MOCK_DATE,
  updatedAt: GET_MOCK_DATE,
  deletedAt: null
});

export const UsersResponse = {
  create: { created: true, id: getMockUUID() } as UserCreateOutput,
  delete: { ...fullEntity, deletedAt: GET_MOCK_DATE } as UserDeleteOutput,
  update: fullEntity as UserUpdateOutput,
  getByID: fullEntity as UserGetByIdOutput,
  list: { docs: [fullEntity], limit: 10, page: 1, total: 1 } as UserListOutput
};
