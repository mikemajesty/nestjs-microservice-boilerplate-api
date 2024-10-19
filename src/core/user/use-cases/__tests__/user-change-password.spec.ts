import { Test } from '@nestjs/testing';

import { RoleEntity, RoleEnum } from '@/core/role/entity/role';
import { LoggerModule } from '@/infra/logger';
import { IUserChangePasswordAdapter } from '@/modules/user/adapter';
import { ApiBadRequestException, ApiNotFoundException } from '@/utils/exception';
import { expectZodError, getMockUUID } from '@/utils/tests';

import { UserEntity } from '../../entity/user';
import { UserPasswordEntity } from '../../entity/user-password';
import { IUserRepository } from '../../repository/user';
import { UserChangePasswordInput, UserChangePasswordUsecase } from '../user-change-password';

describe(UserChangePasswordUsecase.name, () => {
  let usecase: IUserChangePasswordAdapter;
  let repository: IUserRepository;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [
        {
          provide: IUserRepository,
          useValue: {}
        },
        {
          provide: IUserChangePasswordAdapter,
          useFactory: (userRepository: IUserRepository) => {
            return new UserChangePasswordUsecase(userRepository);
          },
          inject: [IUserRepository]
        }
      ]
    }).compile();

    usecase = app.get(IUserChangePasswordAdapter);
    repository = app.get(IUserRepository);
  });

  test('when no input is specified, should expect an error', async () => {
    await expectZodError(
      () => usecase.execute({}),
      (issues) => {
        expect(issues).toEqual([
          { message: 'Required', path: UserEntity.nameOf('id') },
          { message: 'Required', path: UserPasswordEntity.nameOf('password') },
          { message: 'Required', path: 'newPassword' },
          { message: 'Required', path: 'confirmPassword' }
        ]);
      }
    );
  });

  const input: UserChangePasswordInput = {
    id: getMockUUID(),
    password: '****',
    confirmPassword: '****',
    newPassword: '****'
  };

  test('when user not found, should expect an error', async () => {
    repository.findOneWithRelation = jest.fn().mockResolvedValue(null);

    await expect(usecase.execute(input)).rejects.toThrow(ApiNotFoundException);
  });

  const user = new UserEntity({
    id: getMockUUID(),
    email: 'admin@admin.com',
    name: 'Admin',
    password: new UserPasswordEntity({ password: '69bf0bc46f51b33377c4f3d92caf876714f6bbbe99e7544487327920873f9820' }),
    roles: [new RoleEntity({ name: RoleEnum.USER })]
  });

  test('when user password is incorrect, should expect an error', async () => {
    repository.findOneWithRelation = jest.fn().mockResolvedValue(user);

    await expect(usecase.execute({ ...input, password: 'wrongPassword' })).rejects.toThrow(ApiBadRequestException);
  });

  test('when user password are differents, should expect an error', async () => {
    repository.findOneWithRelation = jest.fn().mockResolvedValue(user);

    await expect(usecase.execute({ ...input, confirmPassword: 'wrongPassword' })).rejects.toThrow(
      ApiBadRequestException
    );
  });

  test('when change password successfully, should change password', async () => {
    repository.findOneWithRelation = jest.fn().mockResolvedValue(user);
    repository.create = jest.fn();

    await expect(usecase.execute(input)).resolves.toBeUndefined();
    expect(repository.create).toHaveBeenCalled();
  });
});
