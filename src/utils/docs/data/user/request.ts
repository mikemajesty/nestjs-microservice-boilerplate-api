import { UserRole } from '@/core/user/entity/user';
import { UserCreateInput } from '@/core/user/use-cases/user-create';
import { UserUpdateInput } from '@/core/user/use-cases/user-update';
import { generateUUID } from '@/utils/tests/tests';

export const UsersRequest = {
  create: { login: 'login', password: '*****', roles: [UserRole.USER] } as UserCreateInput,
  update: { id: generateUUID(), login: 'login', password: '*****', roles: [UserRole.USER] } as UserUpdateInput
};
