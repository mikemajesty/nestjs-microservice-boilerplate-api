import { UserEntity, UserRole } from '@/core/user/entity/user';

export class UserResponseMock {
  static readonly userMock = new UserEntity({
    login: 'login',
    password: '**********',
    roles: [UserRole.USER]
  });

  static readonly usersMock = [
    new UserEntity({
      ...this.userMock,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null
    })
  ];
}
