import { UserRole } from '@/core/user/entity/user';
import { UserCreateInput } from '@/core/user/use-cases/user-create';
import { UserUpdateInput } from '@/core/user/use-cases/user-update';
import { getMockUUID } from '@/utils/tests';

export const UsersRequest = {
  create: { email: 'admin@admin.com', password: '*****', roles: [UserRole.USER] } as UserCreateInput,
  update: { id: getMockUUID(), email: 'admin@admin.com', password: '*****', roles: [UserRole.USER] } as UserUpdateInput
};
