import { UserRoleEnum } from '@/core/user/entity/user';
import { UserChangePasswordInput } from '@/core/user/use-cases/user-change-password';
import { UserCreateInput } from '@/core/user/use-cases/user-create';
import { UserUpdateInput } from '@/core/user/use-cases/user-update';
import { getMockUUID } from '@/utils/tests';

export const UsersRequest = {
  create: {
    name: 'Admin',
    email: 'admin@admin.com',
    password: '*****',
    roles: Object.values(UserRoleEnum)
  } as UserCreateInput,
  update: {
    name: 'Admin',
    id: getMockUUID(),
    email: 'admin@admin.com',
    roles: Object.values(UserRoleEnum)
  } as UserUpdateInput,
  changePassword: { password: '**', confirmPassword: '***', newPassword: '***' } as UserChangePasswordInput
};
