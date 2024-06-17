import { Test } from '@nestjs/testing';

import { RoleEntity, RoleEnum } from '@/core/role/entity/role';
import { IRoleRepository } from '@/core/role/repository/role';
import { ILoggerAdapter, LoggerModule } from '@/infra/logger';
import { CryptoLibModule, ICryptoAdapter } from '@/libs/crypto';
import { IEventAdapter } from '@/libs/event';
import { IUserCreateAdapter } from '@/modules/user/adapter';
import { ApiConflictException, ApiNotFoundException } from '@/utils/exception';
import { expectZodError, getMockUUID } from '@/utils/tests';

import { UserEntity } from '../../entity/user';
import { UserPasswordEntity } from '../../entity/user-password';
import { IUserRepository } from '../../repository/user';
import { UserCreateInput, UserCreateUsecase } from '../user-create';

const userDefaultOutput = {
  id: getMockUUID(),
  email: 'admin@admin.com',
  name: 'Admin',
  role: new RoleEntity({ name: RoleEnum.USER }),
  password: new UserPasswordEntity({ password: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918' })
} as UserEntity;

describe(UserCreateUsecase.name, () => {
  let usecase: IUserCreateAdapter;
  let repository: IUserRepository;
  let roleRepository: IRoleRepository;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      imports: [LoggerModule, CryptoLibModule],
      providers: [
        {
          provide: IUserRepository,
          useValue: {}
        },
        {
          provide: IRoleRepository,
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
            crypto: ICryptoAdapter,
            roleRepository: IRoleRepository
          ) => {
            return new UserCreateUsecase(userRepository, logger, event, crypto, roleRepository);
          },
          inject: [IUserRepository, ILoggerAdapter, IEventAdapter, ICryptoAdapter, IRoleRepository]
        }
      ]
    }).compile();

    usecase = app.get(IUserCreateAdapter);
    repository = app.get(IUserRepository);
    roleRepository = app.get(IRoleRepository);
  });

  test('when no input is specified, should expect an error', async () => {
    await expectZodError(
      () => usecase.execute({}),
      (issues) => {
        expect(issues).toEqual([
          { message: 'Required', path: UserEntity.nameOf('email') },
          { message: 'Required', path: UserEntity.nameOf('name') },
          { message: 'Required', path: UserPasswordEntity.nameOf('password') },
          { message: 'Required', path: UserEntity.nameOf('role') }
        ]);
      }
    );
  });

  const defaultInput: UserCreateInput = {
    email: 'admin@admin.com',
    name: 'Admin',
    password: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
    role: RoleEnum.USER
  };
  test('when role not found, should expect an error', async () => {
    roleRepository.findOne = jest.fn().mockResolvedValue(null);
    await expect(usecase.execute(defaultInput)).rejects.toThrow(ApiNotFoundException);
  });

  const roleOutput = new RoleEntity({ name: RoleEnum.USER });
  test('when the user is created successfully, should expect an user that has been created', async () => {
    roleRepository.findOne = jest.fn().mockResolvedValue(roleOutput);
    repository.findOne = jest.fn().mockResolvedValue(null);
    repository.create = jest.fn().mockResolvedValue(userDefaultOutput);

    await expect(usecase.execute(defaultInput)).resolves.toEqual(userDefaultOutput);
  });

  test('when user already exists, should expect an error', async () => {
    roleRepository.findOne = jest.fn().mockResolvedValue(roleOutput);
    repository.findOne = jest.fn().mockResolvedValue(userDefaultOutput);
    await expect(usecase.execute(defaultInput)).rejects.toThrow(ApiConflictException);
  });

  test('when user created successfully, should expect an user', async () => {
    roleRepository.findOne = jest.fn().mockResolvedValue(roleOutput);
    repository.findOne = jest.fn().mockResolvedValue(null);
    repository.create = jest.fn().mockResolvedValue(userDefaultOutput);

    await expect(usecase.execute(defaultInput)).resolves.toEqual(userDefaultOutput);
  });
});
