import { Test } from '@nestjs/testing';
import { TestMock } from 'test/mock';

import { RoleEntity, RoleEnum } from '@/core/role/entity/role';
import { IRoleRepository } from '@/core/role/repository/role';
import { ILoggerAdapter, LoggerModule } from '@/infra/logger';
import { CreatedModel } from '@/infra/repository';
import { IUserUpdateAdapter } from '@/modules/user/adapter';
import { ApiConflictException, ApiNotFoundException } from '@/utils/exception';
import { UUIDUtils } from '@/utils/uuid';
import { ZodExceptionIssue } from '@/utils/validator';

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
    await TestMock.expectZodError(
      () => usecase.execute({} as UserUpdateInput, TestMock.getMockTracing()),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([{ message: 'Required', path: TestMock.nameOf<UserUpdateInput>('id') }]);
      }
    );
  });

  const user = new UserEntity({
    id: TestMock.getMockUUID(),
    name: 'Admin',
    email: 'admin@admin.com',
    roles: [new RoleEntity({ id: TestMock.getMockUUID(), name: RoleEnum.USER })]
  });

  const input: UserUpdateInput = {
    id: user.id,
    email: user.email,
    name: user.name,
    roles: [RoleEnum.USER]
  };

  test('when user not found, should expect an error', async () => {
    repository.findOne = TestMock.mockResolvedValue<UserEntity>(null);

    await expect(usecase.execute(input, TestMock.getMockTracing())).rejects.toThrow(ApiNotFoundException);
  });

  const role = new RoleEntity({ id: UUIDUtils.create(), name: RoleEnum.USER });

  test('when user already exists, should expect an error', async () => {
    repository.findOne = TestMock.mockResolvedValue<UserEntity>(user);
    repository.existsOnUpdate = TestMock.mockResolvedValue<boolean>(true);
    roleRepository.findIn = TestMock.mockResolvedValue<RoleEntity[]>([role]);

    await expect(usecase.execute(input, TestMock.getMockTracing())).rejects.toThrow(ApiConflictException);
  });

  test('when nole not found, should expect an error', async () => {
    repository.findOne = TestMock.mockResolvedValue<UserEntity>(user);
    roleRepository.findIn = TestMock.mockResolvedValue<RoleEntity[]>([]);

    await expect(usecase.execute(input, TestMock.getMockTracing())).rejects.toThrow(ApiNotFoundException);
  });

  test('when user updated successfully, should expect an user updated', async () => {
    repository.findOne = TestMock.mockResolvedValue<UserEntity>(user);
    repository.existsOnUpdate = TestMock.mockResolvedValue<boolean>(false);
    roleRepository.findIn = TestMock.mockResolvedValue<RoleEntity[]>([role]);
    repository.create = TestMock.mockResolvedValue<CreatedModel>();

    await expect(usecase.execute(input, TestMock.getMockTracing())).resolves.toEqual(user);
  });

  test('when user role not provided, should use user role, then should expect an user updated', async () => {
    repository.findOne = TestMock.mockResolvedValue<UserEntity>(user);
    repository.existsOnUpdate = TestMock.mockResolvedValue<boolean>(false);
    roleRepository.findIn = TestMock.mockResolvedValue<RoleEntity[]>([role]);
    repository.create = TestMock.mockResolvedValue<CreatedModel>();

    await expect(usecase.execute({ id: user.id }, TestMock.getMockTracing())).resolves.toEqual(user);
  });
});
