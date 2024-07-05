import { Test } from '@nestjs/testing';

import { PermissionEntity } from '@/core/permission/entity/permission';
import { IPermissionRepository } from '@/core/permission/repository/permission';
import { IRoleDeletePermissionAdapter } from '@/modules/role/adapter';
import { ApiNotFoundException } from '@/utils/exception';
import { expectZodError, getMockUUID } from '@/utils/tests';

import { RoleEntity, RoleEnum } from '../../entity/role';
import { IRoleRepository } from '../../repository/role';
import { RoleAddPermissionInput } from '../role-add-permission';
import { RoleDeletePermissionUsecase } from '../role-delete-permission';

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
    await expectZodError(
      () => usecase.execute({}),
      (issues) => {
        expect(issues).toEqual([
          { message: 'Required', path: RoleEntity.nameOf('id') },
          { message: 'Required', path: RoleEntity.nameOf('permissions') }
        ]);
      }
    );
  });

  const input: RoleAddPermissionInput = {
    id: getMockUUID(),
    permissions: ['user:create']
  };

  test('when role not exists, should expect an error', async () => {
    repository.findOne = jest.fn().mockResolvedValue(null);

    await expect(usecase.execute(input)).rejects.toThrow(ApiNotFoundException);
  });

  const permissions = [new PermissionEntity({ name: 'user:create' }), new PermissionEntity({ name: 'user:update' })];

  const role = new RoleEntity({ name: RoleEnum.USER, permissions: permissions });

  test('when some permisson, should expect an error', async () => {
    repository.findOne = jest.fn().mockResolvedValue(role);
    permissionRepository.findIn = jest.fn().mockResolvedValue(permissions);
    repository.create = jest.fn();

    await expect(
      usecase.execute({ ...input, permissions: input.permissions.concat('user:getbyid') })
    ).resolves.toBeUndefined();
    expect(repository.create).toHaveBeenCalled();
  });
});
