import { UserRole } from '@/core/user/entity/user';
import { UserEntity } from '@/core/user/entity/user';

export const UserAdminSeed = {
  id: 'b23fd7b8-b1eb-44df-b99e-297bf346e88e',
  login: 'admin',
  password: 'admin',
  roles: [UserRole.BACKOFFICE, UserRole.USER]
} as UserEntity;
