import { Test } from '@nestjs/testing';

import { ILoggerAdapter, LoggerModule } from '@/infra/logger';
import { CryptoLibModule, ICryptoAdapter } from '@/libs/crypto';
import { IEventAdapter } from '@/libs/event';
import { IUserCreateAdapter } from '@/modules/user/adapter';
import { ApiConflictException } from '@/utils/exception';
import { expectZodError, getMockTracing, getMockUUID } from '@/utils/tests';

import { UserEntity, UserRoleEnum } from '../../entity/user';
import { UserPasswordEntity } from '../../entity/user-password';
import { IUserRepository } from '../../repository/user';
import { UserCreateInput, UserCreateUsecase } from '../user-create';

const userDefaultOutput = {
  id: getMockUUID(),
  email: 'admin@admin.com',
  name: 'Admin',
  roles: [UserRoleEnum.USER],
  password: new UserPasswordEntity({ password: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918' })
} as UserEntity;

describe(UserCreateUsecase.name, () => {
  let usecase: IUserCreateAdapter;
  let repository: IUserRepository;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      imports: [LoggerModule, CryptoLibModule],
      providers: [
        {
          provide: IUserRepository,
          useValue: {}
        },
        {
          provide: IEventAdapter,
          useValue: {
            emit: jest.fn()
          }
        },
        {
          provide: IUserCreateAdapter,
          useFactory: (
            userRepository: IUserRepository,
            logger: ILoggerAdapter,
            event: IEventAdapter,
            crypto: ICryptoAdapter
          ) => {
            return new UserCreateUsecase(userRepository, logger, event, crypto);
          },
          inject: [IUserRepository, ILoggerAdapter, IEventAdapter, ICryptoAdapter]
        }
      ]
    }).compile();

    usecase = app.get(IUserCreateAdapter);
    repository = app.get(IUserRepository);
  });

  test('when no input is specified, should expect an error', async () => {
    await expectZodError(
      () => usecase.execute({}, getMockTracing()),
      (issues) => {
        expect(issues).toEqual([
          { message: 'Required', path: UserEntity.nameOf('email') },
          { message: 'Required', path: UserEntity.nameOf('name') },
          { message: 'Required', path: UserEntity.nameOf('roles') },
          { message: 'Required', path: UserPasswordEntity.nameOf('password') }
        ]);
      }
    );
  });

  const defaultInput: UserCreateInput = {
    email: 'admin@admin.com',
    name: 'Admin',
    password: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
    roles: [UserRoleEnum.USER]
  };
  test('when the user is created successfully, should expect an user that has been created', async () => {
    repository.findOne = jest.fn().mockResolvedValue(null);
    repository.create = jest.fn().mockResolvedValue(userDefaultOutput);

    await expect(usecase.execute(defaultInput, getMockTracing())).resolves.toEqual(userDefaultOutput);
  });

  test('when user already exists, should expect an error', async () => {
    repository.findOne = jest.fn().mockResolvedValue(userDefaultOutput);
    await expect(usecase.execute(defaultInput, getMockTracing())).rejects.toThrow(ApiConflictException);
  });

  test('when user created successfully, should expect an user', async () => {
    repository.findOne = jest.fn().mockResolvedValue(null);
    repository.create = jest.fn().mockResolvedValue(userDefaultOutput);

    await expect(usecase.execute(defaultInput, getMockTracing())).resolves.toEqual(userDefaultOutput);
  });
});
