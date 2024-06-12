import { Test } from '@nestjs/testing';

import {
  PermissionListInput,
  PermissionListOutput,
  PermissionListUsecase
} from '@/core/permission/use-cases/permission-list';
import { IPermissionListAdapter } from '@/modules/permission/adapter';
import { expectZodError, getMockUUID } from '@/utils/tests';

import { IPermissionRepository } from '../../repository/permission';
import { PermissionEntity, PermissionEnum } from './../../entity/permission';

const successInput: PermissionListInput = { limit: 1, page: 1, search: {}, sort: { createdAt: -1 } };

const failureInput: PermissionListInput = { search: null, sort: null, limit: 10, page: 1 };

describe('PermissionListUsecase', () => {
  let usecase: IPermissionListAdapter;
  let repository: IPermissionRepository;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      providers: [
        {
          provide: IPermissionRepository,
          useValue: {}
        },
        {
          provide: IPermissionListAdapter,
          useFactory: (permissionRepository: IPermissionRepository) => {
            return new PermissionListUsecase(permissionRepository);
          },
          inject: [IPermissionRepository]
        }
      ]
    }).compile();

    usecase = app.get(IPermissionListAdapter);
    repository = app.get(IPermissionRepository);
  });

  test('when sort input is specified, should expect an error', async () => {
    await expectZodError(
      () => usecase.execute(failureInput),
      (issues) => {
        expect(issues).toEqual([{ message: 'Expected object, received null', path: 'sort' }]);
      }
    );
  });

  test('when permission are found, should expect an permission list', async () => {
    const doc = new PermissionEntity({
      id: getMockUUID(),
      name: PermissionEnum.ALL,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const paginateOutput: PermissionListOutput = { docs: [doc], page: 1, limit: 1, total: 1 };

    repository.paginate = jest.fn().mockResolvedValue(paginateOutput);

    await expect(usecase.execute(successInput)).resolves.toEqual({
      docs: [doc],
      page: 1,
      limit: 1,
      total: 1
    });
  });

  test('when permission not found, should expect an empty list', async () => {
    const paginateOutput: PermissionListOutput = { docs: [], page: 1, limit: 1, total: 1 };

    repository.paginate = jest.fn().mockResolvedValue(paginateOutput);

    await expect(usecase.execute(successInput)).resolves.toEqual(paginateOutput);
  });
});
