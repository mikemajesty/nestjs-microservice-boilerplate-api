import { Test } from '@nestjs/testing';

import { ILoggerAdapter } from '@/infra/logger';
import { IPermissionUpdateAdapter } from '@/modules/permission/adapter';
import { ApiNotFoundException } from '@/utils/exception';
import { expectZodError, getMockUUID } from '@/utils/tests';

import { IPermissionRepository } from '../../repository/permission';
import { PermissionUpdateInput, PermissionUpdateOutput, PermissionUpdateUsecase } from '../permission-update';
import { PermissionEntity } from './../../entity/permission';

const successInput: PermissionUpdateInput = {
  id: getMockUUID()
};

const failureInput: PermissionUpdateInput = {};

describe('PermissionUpdateUsecase', () => {
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
    await expectZodError(
      () => usecase.execute(failureInput),
      (issues) => {
        expect(issues).toEqual([{ message: 'Required', path: PermissionEntity.nameOf('id') }]);
      }
    );
  });

  test('when permission not found, should expect an error', async () => {
    repository.findById = jest.fn().mockResolvedValue(null);

    await expect(usecase.execute(successInput)).rejects.toThrowError(ApiNotFoundException);
  });

  test('when permission updated successfully, should expect an permission that has been updated', async () => {
    const findByIdOutput: PermissionUpdateOutput = new PermissionEntity({
      id: getMockUUID(),
      name: 'all'
    });

    repository.findById = jest.fn().mockResolvedValue(findByIdOutput);
    repository.updateOne = jest.fn().mockResolvedValue(null);

    await expect(usecase.execute(successInput)).resolves.toEqual(findByIdOutput);
  });
});
