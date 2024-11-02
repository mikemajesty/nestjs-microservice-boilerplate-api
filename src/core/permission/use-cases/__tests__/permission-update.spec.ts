import { Test } from '@nestjs/testing';
import { ZodIssue } from 'zod';

import { ILoggerAdapter } from '@/infra/logger';
import { IPermissionUpdateAdapter } from '@/modules/permission/adapter';
import { ApiConflictException, ApiNotFoundException } from '@/utils/exception';
import { TestUtils } from '@/utils/tests';

import { IPermissionRepository } from '../../repository/permission';
import { PermissionUpdateInput, PermissionUpdateUsecase } from '../permission-update';
import { PermissionEntity } from './../../entity/permission';

describe(PermissionUpdateUsecase.name, () => {
  let usecase: IPermissionUpdateAdapter;
  let repository: IPermissionRepository;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      providers: [
        {
          provide: IPermissionRepository,
          useValue: {}
        },
        {
          provide: ILoggerAdapter,
          useValue: {
            info: jest.fn()
          }
        },
        {
          provide: IPermissionUpdateAdapter,
          useFactory: (permissionRepository: IPermissionRepository, logger: ILoggerAdapter) => {
            return new PermissionUpdateUsecase(permissionRepository, logger);
          },
          inject: [IPermissionRepository, ILoggerAdapter]
        }
      ]
    }).compile();

    usecase = app.get(IPermissionUpdateAdapter);
    repository = app.get(IPermissionRepository);
  });

  test('when no input is specified, should expect an error', async () => {
    await TestUtils.expectZodError(
      () => usecase.execute({} as PermissionUpdateInput),
      (issues: ZodIssue[]) => {
        expect(issues).toEqual([{ message: 'Required', path: PermissionEntity.nameOf('id') }]);
      }
    );
  });

  const input: PermissionUpdateInput = {
    id: TestUtils.getMockUUID()
  };

  test('when permission not found, should expect an error', async () => {
    repository.findById = jest.fn().mockResolvedValue(null);

    await expect(usecase.execute(input)).rejects.toThrow(ApiNotFoundException);
  });

  const permission = new PermissionEntity({
    id: TestUtils.getMockUUID(),
    name: 'name:permission'
  });

  test('when permission exists, should expect an error', async () => {
    repository.findById = jest.fn().mockResolvedValue(permission);
    repository.existsOnUpdate = jest.fn().mockResolvedValue(true);

    await expect(usecase.execute({ ...input, name: 'permission:create' })).rejects.toThrow(ApiConflictException);
  });

  test('when permission updated successfully, should expect an permission that has been updated', async () => {
    repository.findById = jest.fn().mockResolvedValue(permission);
    repository.updateOne = jest.fn().mockResolvedValue(null);
    repository.existsOnUpdate = jest.fn().mockResolvedValue(false);

    await expect(usecase.execute(input)).resolves.toEqual(permission);
  });
});
