import { Test } from '@nestjs/testing';

import { IPermissionGetByIDAdapter } from '@/modules/permission/adapter';
import { ApiNotFoundException } from '@/utils/exception';
import { expectZodError, getMockUUID } from '@/utils/tests';

import { IPermissionRepository } from '../../repository/permission';
import { PermissionGetByIDInput, PermissionGetByIDOutput, PermissionGetByIdUsecase } from '../permission-get-by-id';
import { PermissionEntity } from './../../entity/permission';

const successInput: PermissionGetByIDInput = {
  id: getMockUUID()
};

const failureInput: PermissionGetByIDInput = {};

describe('PermissionGetByIdUsecase', () => {
  let usecase: IPermissionGetByIDAdapter;
  let repository: IPermissionRepository;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      providers: [
        {
          provide: IPermissionRepository,
          useValue: {}
        },
        {
          provide: IPermissionGetByIDAdapter,
          useFactory: (permissionRepository: IPermissionRepository) => {
            return new PermissionGetByIdUsecase(permissionRepository);
          },
          inject: [IPermissionRepository]
        }
      ]
    }).compile();

    usecase = app.get(IPermissionGetByIDAdapter);
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

  test('when permission found, should expect a permission that has been found', async () => {
    const findByIdOutput: PermissionGetByIDOutput = new PermissionEntity({
      id: getMockUUID(),
      name: 'all'
    });
    repository.findById = jest.fn().mockResolvedValue(findByIdOutput);

    await expect(usecase.execute(successInput)).resolves.toEqual(findByIdOutput);
  });
});
