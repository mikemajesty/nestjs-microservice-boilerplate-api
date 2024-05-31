import { Test } from '@nestjs/testing';

import { UserEntity, UserRole } from '@/core/user/entity/user';
import { IUserRepository } from '@/core/user/repository/user';
import { ICryptoAdapter } from '@/libs/crypto';
import { IEventAdapter } from '@/libs/event';
import { ITokenAdapter } from '@/libs/token';
import { IConfirmResetPasswordAdapter } from '@/modules/reset-password/adapter';
import { ApiBadRequestException, ApiNotFoundException, ApiUnauthorizedException } from '@/utils/exception';
import { expectZodError, getMockUUID } from '@/utils/tests';

import { ResetPasswordEntity } from '../../entity/reset-password';
import { IResetPasswordRepository } from '../../repository/reset-password';
import { ConfirmResetPasswordInput, ConfirmResetPasswordUsecase } from '../confirm';

describe(ConfirmResetPasswordUsecase.name, () => {
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
          provide: ICryptoAdapter,
          useValue: {
            createHash: jest.fn().mockReturnValue('hash')
          }
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
            event: IEventAdapter,
            crypto: ICryptoAdapter
          ) => {
            return new ConfirmResetPasswordUsecase(repository, userRepository, token, event, crypto);
          },
          inject: [IResetPasswordRepository, IUserRepository, ITokenAdapter, IEventAdapter, ICryptoAdapter]
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

  const defaultInput: ConfirmResetPasswordInput = { confirmPassword: '123456', password: '123456', token: 'token' };
  const defaultUser = new UserEntity({
    id: getMockUUID(),
    email: 'admin@admin.com',
    password: '****',
    roles: [UserRole.USER]
  });
  test('when user not found, should expect an error', async () => {
    userRepository.findOne = jest.fn().mockResolvedValue(null);
    await expect(usecase.execute(defaultInput)).rejects.toThrow(ApiNotFoundException);
  });

  test('when token was expired, should expect an error', async () => {
    userRepository.findOne = jest.fn().mockResolvedValue(defaultUser);
    repository.findOne = jest.fn().mockResolvedValue(null);
    await expect(usecase.execute(defaultInput)).rejects.toThrow(ApiUnauthorizedException);
  });
  const defaultResetPassword = new ResetPasswordEntity({ id: getMockUUID(), token: 'token', userId: getMockUUID() });

  test('when confirm successfully, should expect a void', async () => {
    userRepository.findOne = jest.fn().mockResolvedValue(defaultUser);
    userRepository.updateOne = jest.fn();
    repository.findOne = jest.fn().mockResolvedValue(defaultResetPassword);
    repository.remove = jest.fn();
    await expect(usecase.execute(defaultInput)).resolves.toBeUndefined();
  });
});
