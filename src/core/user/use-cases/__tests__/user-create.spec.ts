import { Test } from '@nestjs/testing';

import { RoleEntity, RoleEnum } from '@/core/role/entity/role';
import { IRoleRepository } from '@/core/role/repository/role';
import { ILoggerAdapter, LoggerModule } from '@/infra/logger';
import { CreatedModel } from '@/infra/repository';
import { EmitEventOutput, IEventAdapter } from '@/libs/event';
import { IUserCreateAdapter } from '@/modules/user/adapter';
import { ApiConflictException, ApiNotFoundException } from '@/utils/exception';
import { TestUtils } from '@/utils/test/util';
import { ZodExceptionIssue } from '@/utils/validator';

import { UserEntity } from '../../entity/user';
import { UserPasswordEntity } from '../../entity/user-password';
import { IUserRepository } from '../../repository/user';
import { UserCreateInput, UserCreateUsecase } from '../user-create';

describe(UserCreateUsecase.name, () => {
  let usecase: IUserCreateAdapter;
  let repository: IUserRepository;
  let roleRepository: IRoleRepository;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      imports: [LoggerModule],
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
            emit: TestUtils.mockResolvedValue<EmitEventOutput>()
          }
        },
        {
          provide: IUserCreateAdapter,
          useFactory: (
            userRepository: IUserRepository,
            logger: ILoggerAdapter,
            event: IEventAdapter,
            roleRepository: IRoleRepository
          ) => {
            return new UserCreateUsecase(userRepository, logger, event, roleRepository);
          },
          inject: [IUserRepository, ILoggerAdapter, IEventAdapter, IRoleRepository]
        }
      ]
    }).compile();

    usecase = app.get(IUserCreateAdapter);
    repository = app.get(IUserRepository);
    roleRepository = app.get(IRoleRepository);
  });

  test('when no input is specified, should expect an error', async () => {
    await TestUtils.expectZodError(
      () => usecase.execute({} as UserCreateInput, TestUtils.getMockTracing()),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([
          { message: 'Required', path: TestUtils.nameOf<UserCreateInput>('email') },
          { message: 'Required', path: TestUtils.nameOf<UserCreateInput>('name') },
          { message: 'Required', path: TestUtils.nameOf<UserCreateInput>('password') },
          { message: 'Required', path: TestUtils.nameOf<UserCreateInput>('roles') }
        ]);
      }
    );
  });

  const input: UserCreateInput = {
    email: 'admin@admin.com',
    name: 'Admin',
    password: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
    roles: [RoleEnum.USER]
  };

  test('when role not found, should expect an error', async () => {
    roleRepository.findIn = TestUtils.mockResolvedValue<RoleEntity[]>([]);

    await expect(usecase.execute(input, TestUtils.getMockTracing())).rejects.toThrow(ApiNotFoundException);
  });

  const role = new RoleEntity({ id: TestUtils.getMockUUID(), name: RoleEnum.USER });

  const user = new UserEntity({
    id: TestUtils.getMockUUID(),
    email: 'admin@admin.com',
    name: 'Admin',
    roles: [new RoleEntity({ id: TestUtils.getMockUUID(), name: RoleEnum.USER })],
    password: new UserPasswordEntity({
      id: TestUtils.getMockUUID(),
      password: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'
    })
  });

  test('when user already exists, should expect an error', async () => {
    roleRepository.findIn = TestUtils.mockResolvedValue<RoleEntity[]>([role]);
    repository.findOne = TestUtils.mockResolvedValue<UserEntity>(user);

    await expect(usecase.execute(input, TestUtils.getMockTracing())).rejects.toThrow(ApiConflictException);
  });

  test('when user created successfully, should expect an user', async () => {
    roleRepository.findIn = TestUtils.mockResolvedValue<RoleEntity[]>([role]);
    repository.findOne = TestUtils.mockResolvedValue<UserEntity>(null);
    const createOutput = { created: true, id: TestUtils.getMockUUID() };
    repository.create = TestUtils.mockResolvedValue<CreatedModel>(createOutput);

    await expect(usecase.execute(input, TestUtils.getMockTracing())).resolves.toEqual(createOutput);
  });
});
