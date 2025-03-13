import { Test } from '@nestjs/testing';
import { TestMock } from 'test/mock';

import { PermissionEntity } from '@/core/permission/entity/permission';
import { IPermissionRepository } from '@/core/permission/repository/permission';
import { CreatedModel } from '@/infra/repository';
import { IRoleDeletePermissionAdapter } from '@/modules/role/adapter';
import { ApiNotFoundException } from '@/utils/exception';
import { UUIDUtils } from '@/utils/uuid';
import { ZodExceptionIssue } from '@/utils/validator';

import { RoleEntity, RoleEnum } from '../../entity/role';
import { IRoleRepository } from '../../repository/role';
import { RoleAddPermissionInput } from '../role-add-permission';
import { RoleDeletePermissionInput, RoleDeletePermissionUsecase } from '../role-delete-permission';

describe(RoleDeletePermissionUsecase.name, () => {
  let usecase: IRoleDeletePermissionAdapter;
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
          provide: IRoleDeletePermissionAdapter,
          useFactory: (roleRepository: IRoleRepository, permissionRepository: IPermissionRepository) => {
            return new RoleDeletePermissionUsecase(roleRepository, permissionRepository);
          },
          inject: [IRoleRepository, IPermissionRepository]
        }
      ]
    }).compile();

    usecase = app.get(IRoleDeletePermissionAdapter);
    repository = app.get(IRoleRepository);
    permissionRepository = app.get(IPermissionRepository);
  });

  test('when no input is specified, should expect an error', async () => {
    await TestMock.expectZodError(
      () => usecase.execute({} as RoleDeletePermissionInput),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([
          { message: 'Required', path: TestMock.nameOf<RoleDeletePermissionInput>('id') },
          { message: 'Required', path: TestMock.nameOf<RoleDeletePermissionInput>('permissions') }
        ]);
      }
    );
  });

  const input: RoleAddPermissionInput = {
    id: TestMock.getMockUUID(),
    permissions: ['user:create']
  };

  test('when role not exists, should expect an error', async () => {
    repository.findOne = TestMock.mockResolvedValue<RoleEntity>(null);

    await expect(usecase.execute(input)).rejects.toThrow(ApiNotFoundException);
  });

  const permissions = [
    new PermissionEntity({ id: UUIDUtils.create(), name: 'user:create' }),
    new PermissionEntity({ id: UUIDUtils.create(), name: 'user:update' })
  ];

  const role = new RoleEntity({ id: UUIDUtils.create(), name: RoleEnum.USER, permissions });

  test('when some permisson, should expect an error', async () => {
    repository.findOne = TestMock.mockResolvedValue<RoleEntity>(role);
    permissionRepository.findIn = TestMock.mockResolvedValue<PermissionEntity[]>(permissions);
    repository.create = TestMock.mockResolvedValue<CreatedModel>(null);

    await expect(
      usecase.execute({ ...input, permissions: input.permissions.concat('user:getbyid') })
    ).resolves.toBeUndefined();
    expect(repository.create).toHaveBeenCalled();
  });
});
