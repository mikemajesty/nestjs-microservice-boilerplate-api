import { UserRole } from '@/core/user/entity/user';
import { UserEntity } from '@/core/user/entity/user';

export const UserAdminSeed = {
  id: 'b23fd7b8-b1eb-44df-b99e-297bf346e88e',
  login: 'admin',
  //sha256
  password: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
  roles: [UserRole.BACKOFFICE, UserRole.USER]
} as UserEntity;
