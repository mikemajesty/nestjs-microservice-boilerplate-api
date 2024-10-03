import { RoleEnum } from '@/core/role/entity/role';
import { UserChangePasswordInput } from '@/core/user/use-cases/user-change-password';
import { UserCreateInput } from '@/core/user/use-cases/user-create';
import { UserUpdateInput } from '@/core/user/use-cases/user-update';

export const UsersRequest = {
  create: {
    name: 'Admin',
    email: 'admin@admin.com',
    password: '*****',
    roles: [RoleEnum.USER]
  } as UserCreateInput,
  update: {
    name: 'Admin',
    email: 'admin@admin.com',
    roles: [RoleEnum.USER]
  } as UserUpdateInput,
  changePassword: { password: '**', confirmPassword: '***', newPassword: '***' } as UserChangePasswordInput
};
