import { Test } from '@nestjs/testing';

import { UserEntity, UserRoleEnum } from '@/core/user/entity/user';
import { IUserRepository } from '@/core/user/repository/user';
import { ISecretsAdapter } from '@/infra/secrets';
import { IEventAdapter } from '@/libs/event';
import { ITokenAdapter } from '@/libs/token';
import { IConfirmResetPasswordAdapter, ISendEmailResetPasswordAdapter } from '@/modules/reset-password/adapter';
import { ApiNotFoundException } from '@/utils/exception';
import { expectZodError, getMockUUID } from '@/utils/tests';

import { ResetPasswordEntity } from '../../entity/reset-password';
import { IResetPasswordRepository } from '../../repository/reset-password';
import { SendEmailResetPasswordInput, SendEmailResetPasswordUsecase } from '../send-email';

describe(SendEmailResetPasswordUsecase.name, () => {
  let usecase: ISendEmailResetPasswordAdapter;
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
          provide: ISecretsAdapter,
          useValue: {
            HOST: 'localhost'
          }
        },
        {
          provide: IResetPasswordRepository,
          useValue: {}
        },
        {
          provide: ITokenAdapter,
          useValue: {
            sign: jest.fn().mockReturnValue({ token: 'token' })
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
            secret: ISecretsAdapter
          ) => {
            return new SendEmailResetPasswordUsecase(repository, userRepository, token, event, secret);
          },
          inject: [IResetPasswordRepository, IUserRepository, ITokenAdapter, IEventAdapter, ISecretsAdapter]
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
        expect(issues).toEqual([{ message: 'Required', path: 'email' }]);
      }
    );
  });

  const defaultInput: SendEmailResetPasswordInput = { email: 'admin@admin.com' };
  test('when user not found, should expect an error', async () => {
    userRepository.findOne = jest.fn().mockResolvedValue(null);
    await expect(usecase.execute(defaultInput)).rejects.toThrow(ApiNotFoundException);
  });

  const defaultUser = new UserEntity({
    id: getMockUUID(),
    email: 'admin@admin.com',
    name: 'Admin',
    roles: [UserRoleEnum.USER]
  });
  const defaultResetPassword = new ResetPasswordEntity({ id: getMockUUID(), token: 'token', user: defaultUser });

  test('when token was founded, should expect void', async () => {
    userRepository.findOne = jest.fn().mockResolvedValue(defaultUser);
    repository.findByIdUserId = jest.fn().mockResolvedValue(defaultResetPassword);
    await expect(usecase.execute(defaultInput)).resolves.toBeUndefined();
  });

  test('when token was not founded, should expect void', async () => {
    userRepository.findOne = jest.fn().mockResolvedValue(defaultUser);
    repository.findByIdUserId = jest.fn().mockResolvedValue(null);
    repository.create = jest.fn();
    await expect(usecase.execute(defaultInput)).resolves.toBeUndefined();
  });
});
