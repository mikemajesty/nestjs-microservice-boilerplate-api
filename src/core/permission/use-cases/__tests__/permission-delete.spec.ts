import { Test } from '@nestjs/testing';
import { ZodIssue } from 'zod';

import { PermissionDeleteInput, PermissionDeleteUsecase } from '@/core/permission/use-cases/permission-delete';
import { IPermissionDeleteAdapter } from '@/modules/permission/adapter';
import { ApiNotFoundException } from '@/utils/exception';
import { TestUtils } from '@/utils/tests';

import { IPermissionRepository } from '../../repository/permission';
import { PermissionEntity } from './../../entity/permission';

describe(PermissionDeleteUsecase.name, () => {
  let usecase: IPermissionDeleteAdapter;
  let repository: IPermissionRepository;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      providers: [
        {
          provide: IPermissionRepository,
          useValue: {}
        },
        {
          provide: IPermissionDeleteAdapter,
          useFactory: (permissionRepository: IPermissionRepository) => {
            return new PermissionDeleteUsecase(permissionRepository);
          },
          inject: [IPermissionRepository]
        }
      ]
    }).compile();

    usecase = app.get(IPermissionDeleteAdapter);
    repository = app.get(IPermissionRepository);
  });

  test('when no input is specified, should expect an error', async () => {
    await TestUtils.expectZodError(
      () => usecase.execute({} as PermissionDeleteInput),
      (issues: ZodIssue[]) => {
        expect(issues).toEqual([{ message: 'Required', path: PermissionEntity.nameOf('id') }]);
      }
    );
  });

  const input: PermissionDeleteInput = {
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

  test('when permission deleted successfully, should expect a permission that has been deleted', async () => {
    repository.findById = jest.fn().mockResolvedValue(permission);
    repository.updateOne = jest.fn();

    await expect(usecase.execute(input)).resolves.toEqual({
      ...permission,
      deletedAt: expect.any(Date)
    });
  });
});
