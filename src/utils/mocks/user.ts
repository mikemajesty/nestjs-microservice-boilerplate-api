import { UserEntity, UserRole } from '@/core/user/entity/user';

import { generateUUID } from '../tests';

export const userCreateMock = {
  login: 'login',
  password: '**********',
  roles: [UserRole.USER]
} as UserEntity;

export const userResponseMock = {
  id: generateUUID(),
  ...userCreateMock
} as UserEntity;

export const usersResponseMock = {
  ...userResponseMock,
  createdAt: new Date(),
  updatedAt: new Date()
} as UserEntity;
