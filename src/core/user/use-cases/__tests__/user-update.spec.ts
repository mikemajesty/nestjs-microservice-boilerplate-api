import { Test } from '@nestjs/testing';
import { ZodIssue } from 'zod';

import { RoleEntity, RoleEnum } from '@/core/role/entity/role';
import { IRoleRepository } from '@/core/role/repository/role';
import { ILoggerAdapter, LoggerModule } from '@/infra/logger';
import { CreatedModel } from '@/infra/repository';
import { IUserUpdateAdapter } from '@/modules/user/adapter';
import { ApiConflictException, ApiNotFoundException } from '@/utils/exception';
import { TestUtils } from '@/utils/tests';
import { UUIDUtils } from '@/utils/uuid';

import { UserEntity } from '../../entity/user';
import { IUserRepository } from '../../repository/user';
import { UserUpdateInput, UserUpdateUsecase } from '../user-update';

describe(UserUpdateUsecase.name, () => {
  let usecase: IUserUpdateAdapter;
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
          provide: IUserUpdateAdapter,
          useFactory: (userRepository: IUserRepository, logger: ILoggerAdapter, roleRepository: IRoleRepository) => {
            return new UserUpdateUsecase(userRepository, logger, roleRepository);
          },
          inject: [IUserRepository, ILoggerAdapter, IRoleRepository]
        }
      ]
    }).compile();

    usecase = app.get(IUserUpdateAdapter);
    repository = app.get(IUserRepository);
    roleRepository = app.get(IRoleRepository);
  });

  test('when no input is specified, should expect an error', async () => {
    await TestUtils.expectZodError(
      () => usecase.execute({} as UserUpdateInput, TestUtils.getMockTracing()),
      (issues: ZodIssue[]) => {
        expect(issues).toEqual([
          { message: 'Required', path: TestUtils.nameOf<UserUpdateInput>('id') },
          { message: 'Required', path: TestUtils.nameOf<UserUpdateInput>('name') },
          { message: 'Required', path: TestUtils.nameOf<UserUpdateInput>('email') },
          { message: 'Required', path: TestUtils.nameOf<UserUpdateInput>('roles') }
        ]);
      }
    );
  });

  const user = new UserEntity({
    id: TestUtils.getMockUUID(),
    name: 'Admin',
    email: 'admin@admin.com',
    roles: [new RoleEntity({ id: TestUtils.getMockUUID(), name: RoleEnum.USER })]
  });

  const input: UserUpdateInput = {
    id: user.id,
    email: user.email,
    name: user.name,
    roles: [RoleEnum.USER]
  };

  test('when user not found, should expect an error', async () => {
    repository.findOne = TestUtils.mockResolvedValue<UserEntity>(null);

    await expect(usecase.execute(input, TestUtils.getMockTracing())).rejects.toThrow(ApiNotFoundException);
  });

  const role = new RoleEntity({ id: UUIDUtils.create(), name: RoleEnum.USER });

  test('when user already exists, should expect an error', async () => {
    repository.findOne = TestUtils.mockResolvedValue<UserEntity>(user);
    repository.existsOnUpdate = TestUtils.mockResolvedValue<boolean>(true);
    roleRepository.findIn = TestUtils.mockResolvedValue<RoleEntity[]>([role]);

    await expect(usecase.execute(input, TestUtils.getMockTracing())).rejects.toThrow(ApiConflictException);
  });

  test('when nole not found, should expect an error', async () => {
    repository.findOne = TestUtils.mockResolvedValue<UserEntity>(user);
    roleRepository.findIn = TestUtils.mockResolvedValue<RoleEntity[]>([]);

    await expect(usecase.execute(input, TestUtils.getMockTracing())).rejects.toThrow(ApiNotFoundException);
  });

  test('when user updated successfully, should expect an user updated', async () => {
    repository.findOne = TestUtils.mockResolvedValue<UserEntity>(user);
    repository.existsOnUpdate = TestUtils.mockResolvedValue<boolean>(false);
    roleRepository.findIn = TestUtils.mockResolvedValue<RoleEntity[]>([role]);
    repository.create = TestUtils.mockResolvedValue<CreatedModel>();

    await expect(usecase.execute(input, TestUtils.getMockTracing())).resolves.toEqual(user);
  });
});
