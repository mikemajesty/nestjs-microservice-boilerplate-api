import { UserEntity, UserRole } from '@/core/user/entity/user';

import { generateUUID } from '../tests';

export class UserMock {
  static userCreateMock = {
    login: 'login',
    password: '**********',
    roles: [UserRole.USER]
  } as UserEntity;

  static userResponseMock = {
    id: generateUUID(),
    ...this.userCreateMock
  } as UserEntity;

  static usersResponseMock = {
    ...this.userResponseMock,
    createdAt: new Date(),
    updatedAt: new Date()
  } as UserEntity;
}
