import { Test } from '@nestjs/testing';

import { RoleEntity, RoleEnum } from '@/core/role/entity/role';
import { UserEntity } from '@/core/user/entity/user';
import { IUserRepository } from '@/core/user/repository/user';
import { IEventAdapter } from '@/libs/event';
import { ITokenAdapter } from '@/libs/token';
import { IConfirmResetPasswordAdapter } from '@/modules/reset-password/adapter';
import { ApiBadRequestException, ApiNotFoundException, ApiUnauthorizedException } from '@/utils/exception';
import { expectZodError, getMockUUID } from '@/utils/tests';

import { ResetPasswordEntity } from '../../entity/reset-password';
import { IResetPasswordRepository } from '../../repository/reset-password';
import { ResetPasswordConfirmInput, ResetPasswordConfirmUsecase } from '../reset-password-confirm';

describe(ResetPasswordConfirmUsecase.name, () => {
  let usecase: IConfirmResetPasswordAdapter;
  let repository: IResetPasswordRepository;
  let userRepository: IUserRepository;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      imports: [],
      providers: [
        {
          provide: IUserRepository,
          useValue: {}
        },
        {
          provide: IResetPasswordRepository,
          useValue: {}
        },
        {
          provide: ITokenAdapter,
          useValue: {
            verify: jest.fn().mockReturnValue({ id: getMockUUID() })
          }
        },
        {
          provide: IEventAdapter,
          useValue: {
            emit: jest.fn()
          }
        },
        {
          provide: IConfirmResetPasswordAdapter,
          useFactory: (
            repository: IResetPasswordRepository,
            userRepository: IUserRepository,
            token: ITokenAdapter,
            event: IEventAdapter
          ) => {
            return new ResetPasswordConfirmUsecase(repository, userRepository, token, event);
          },
          inject: [IResetPasswordRepository, IUserRepository, ITokenAdapter, IEventAdapter]
        }
      ]
    }).compile();

    usecase = app.get(IConfirmResetPasswordAdapter);
    repository = app.get(IResetPasswordRepository);
    userRepository = app.get(IUserRepository);
  });

  test('when no input is specified, should expect an error', async () => {
    await expectZodError(
      () => usecase.execute({}),
      (issues) => {
        expect(issues).toEqual([
          { message: 'Required', path: 'token' },
          { message: 'Required', path: 'password' },
          { message: 'Required', path: 'confirmPassword' }
        ]);
      }
    );
  });

  test('when password are differents, should expect an error', async () => {
    await expect(usecase.execute({ confirmPassword: '123456', password: '1234567', token: '111' })).rejects.toThrow(
      ApiBadRequestException
    );
  });

  const input: ResetPasswordConfirmInput = { confirmPassword: '123456', password: '123456', token: 'token' };

  const user = new UserEntity({
    id: getMockUUID(),
    email: 'admin@admin.com',
    name: 'Admin',
    roles: [new RoleEntity({ name: RoleEnum.USER })],
    password: { id: getMockUUID(), password: '****' }
  });

  test('when user not found, should expect an error', async () => {
    userRepository.findOneWithRelation = jest.fn().mockResolvedValue(null);

    await expect(usecase.execute(input)).rejects.toThrow(ApiNotFoundException);
  });

  test('when token was expired, should expect an error', async () => {
    userRepository.findOneWithRelation = jest.fn().mockResolvedValue(user);
    repository.findByIdUserId = jest.fn().mockResolvedValue(null);

    await expect(usecase.execute(input)).rejects.toThrow(ApiUnauthorizedException);
  });
  const defaultResetPassword = new ResetPasswordEntity({ id: getMockUUID(), token: 'token', user: user });

  test('when confirm successfully, should expect a void', async () => {
    userRepository.findOneWithRelation = jest.fn().mockResolvedValue(user);
    userRepository.create = jest.fn();
    repository.findByIdUserId = jest.fn().mockResolvedValue(defaultResetPassword);
    repository.remove = jest.fn();

    await expect(usecase.execute(input)).resolves.toBeUndefined();
    expect(userRepository.create).toHaveBeenCalled();
  });
});
