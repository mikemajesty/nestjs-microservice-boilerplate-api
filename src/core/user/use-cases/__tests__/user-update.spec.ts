import { Test } from '@nestjs/testing';

import { RoleEntity, RoleEnum } from '@/core/role/entity/role';
import { IRoleRepository } from '@/core/role/repository/role';
import { ILoggerAdapter, LoggerModule } from '@/infra/logger';
import { IUserUpdateAdapter } from '@/modules/user/adapter';
import { ApiConflictException, ApiNotFoundException } from '@/utils/exception';
import { expectZodError, getMockUUID } from '@/utils/tests';

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
    await expectZodError(
      () => usecase.execute({}),
      (issues) => {
        expect(issues).toEqual([
          { message: 'Required', path: UserEntity.nameOf('id') },
          { message: 'Required', path: UserEntity.nameOf('name') },
          { message: 'Required', path: UserEntity.nameOf('email') },
          { message: 'Required', path: UserEntity.nameOf('role') }
        ]);
      }
    );
  });

  const userOutput = {
    id: getMockUUID(),
    name: 'Admin',
    email: 'admin@admin.com',
    role: new RoleEntity({ name: RoleEnum.USER })
  } as UserEntity;

  const input: UserUpdateInput = {
    id: userOutput.id,
    email: userOutput.email,
    name: userOutput.name,
    role: userOutput.role.name
  };

  test('when user not found, should expect an error', async () => {
    repository.findOneWithRelation = jest.fn().mockResolvedValue(null);
    await expect(usecase.execute(input)).rejects.toThrow(ApiNotFoundException);
  });

  const roleOutput = new RoleEntity({ name: RoleEnum.USER });
  test('when user already exists, should expect an error', async () => {
    repository.findOneWithRelation = jest.fn().mockResolvedValue(userOutput);
    repository.existsOnUpdate = jest.fn().mockResolvedValue(userOutput);
    roleRepository.findOne = jest.fn().mockResolvedValue(roleOutput);
    await expect(usecase.execute(input)).rejects.toThrow(ApiConflictException);
  });

  test('when nole not found, should expect an error', async () => {
    repository.findOneWithRelation = jest.fn().mockResolvedValue(userOutput);
    roleRepository.findOne = jest.fn().mockResolvedValue(null);
    await expect(usecase.execute(input)).rejects.toThrow(ApiNotFoundException);
  });

  test('when user updated successfully, should expect an user that has been updated', async () => {
    repository.findOneWithRelation = jest.fn().mockResolvedValue(userOutput);
    repository.existsOnUpdate = jest.fn().mockResolvedValue(null);
    roleRepository.findOne = jest.fn().mockResolvedValue(roleOutput);
    repository.updateOne = jest.fn();
    await expect(usecase.execute(input)).resolves.toEqual(userOutput);
  });
});
