import { ZodMockSchema } from '@mikemajesty/zod-mock-schema';
import { Test } from '@nestjs/testing';

import { PermissionEntity, PermissionEntitySchema } from '@/core/permission/entity/permission';
import { IPermissionRepository } from '@/core/permission/repository/permission';
import { CreatedModel } from '@/infra/repository';
import { IRoleAddPermissionAdapter } from '@/modules/role/adapter';
import { ApiNotFoundException } from '@/utils/exception';
import { TestUtils } from '@/utils/test/util';
import { ZodExceptionIssue } from '@/utils/validator';

import { RoleEntity, RoleEntitySchema } from '../../entity/role';
import { IRoleRepository } from '../../repository/role';
import { RoleAddPermissionUsecase } from '../role-add-permission';
import { RoleAddPermissionInput, RoleAddPermissionSchema } from './../role-add-permission';

describe(RoleAddPermissionUsecase.name, () => {
  let usecase: IRoleAddPermissionAdapter;
  let repository: IRoleRepository;
  let permissionRepository: IPermissionRepository;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      providers: [
        {
          provide: IRoleRepository,
          useValue: {}
        },
        {
          provide: IPermissionRepository,
          useValue: {}
        },
        {
          provide: IRoleAddPermissionAdapter,
          useFactory: (roleRepository: IRoleRepository, permissionRepository: IPermissionRepository) => {
            return new RoleAddPermissionUsecase(roleRepository, permissionRepository);
          },
          inject: [IRoleRepository, IPermissionRepository]
        }
      ]
    }).compile();

    usecase = app.get(IRoleAddPermissionAdapter);
    repository = app.get(IRoleRepository);
    permissionRepository = app.get(IPermissionRepository);
  });

  test('when no input is specified, should expect an error', async () => {
    await TestUtils.expectZodError(
      () => usecase.execute({} as RoleAddPermissionInput),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([
          { message: 'Required', path: TestUtils.nameOf<RoleAddPermissionInput>('id') },
          { message: 'Required', path: TestUtils.nameOf<RoleAddPermissionInput>('permissions') }
        ]);
      }
    );
  });

  const roleAddPermissionMock = new ZodMockSchema(RoleAddPermissionSchema);
  const input = roleAddPermissionMock.generate({
    overrides: { permissions: ['user:create', 'user:update'] }
  });

  test('when role not exists, should expect an error', async () => {
    repository.findOne = TestUtils.mockResolvedValue<RoleEntity>(null);

    await expect(usecase.execute(input)).rejects.toThrow(ApiNotFoundException);
  });

  const permissionMock = new ZodMockSchema(PermissionEntitySchema);
  const permissions = permissionMock.generateMany<PermissionEntity>(10, {
    overrides: {
      name: permissionMock.faker.helpers.arrayElement(['user:create', 'user:update', 'user:delete', 'user:view'])
    }
  });

  const roleMock = new ZodMockSchema(RoleEntitySchema);
  const role = roleMock.generate<RoleEntity>({
    overrides: {
      permissions: roleMock.faker.helpers.arrayElements(permissions)
    }
  });

  test('when delete permission with associated permission successfully, should expect an update permission', async () => {
    repository.findOne = TestUtils.mockResolvedValue<RoleEntity>(role);
    permissionRepository.findIn = TestUtils.mockResolvedValue<PermissionEntity[]>(permissions);
    repository.create = TestUtils.mockResolvedValue<CreatedModel>();

    await expect(usecase.execute(input)).resolves.toBeUndefined();
    expect(repository.create).toHaveBeenCalled();
  });

  test('when delete permission without associated permission successfully, should expect an update permission', async () => {
    repository.findOne = TestUtils.mockResolvedValue<RoleEntity>({
      ...role,
      permissions: role.permissions.filter((p) => p.name !== 'user:create')
    });
    permissionRepository.findIn = TestUtils.mockResolvedValue<PermissionEntity[]>(permissions);
    repository.create = TestUtils.mockResolvedValue<CreatedModel>();

    await expect(usecase.execute({ ...input, permissions: ['user:create'] })).resolves.toBeUndefined();
    expect(repository.create).toHaveBeenCalled();
  });
});
