import { Test } from '@nestjs/testing';
import { TestMock } from 'test/mock';

import { ILoggerAdapter } from '@/infra/logger';
import { UpdatedModel } from '@/infra/repository';
import { IPermissionUpdateAdapter } from '@/modules/permission/adapter';
import { ApiConflictException, ApiNotFoundException } from '@/utils/exception';
import { ZodExceptionIssue } from '@/utils/validator';

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
            info: TestMock.mockReturnValue<void>()
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
    await TestMock.expectZodError(
      () => usecase.execute({} as PermissionUpdateInput),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([{ message: 'Required', path: TestMock.nameOf<PermissionUpdateInput>('id') }]);
      }
    );
  });

  const input: PermissionUpdateInput = {
    id: TestMock.getMockUUID()
  };

  test('when permission not found, should expect an error', async () => {
    repository.findById = TestMock.mockResolvedValue<PermissionEntity>(null);

    await expect(usecase.execute(input)).rejects.toThrow(ApiNotFoundException);
  });

  const permission = new PermissionEntity({
    id: TestMock.getMockUUID(),
    name: 'name:permission'
  });

  test('when permission exists, should expect an error', async () => {
    repository.findById = TestMock.mockResolvedValue<PermissionEntity>(permission);
    repository.existsOnUpdate = TestMock.mockResolvedValue<boolean>(true);

    await expect(usecase.execute({ ...input, name: 'permission:create' })).rejects.toThrow(ApiConflictException);
  });

  test('when permission updated successfully, should expect an permission updated', async () => {
    repository.findById = TestMock.mockResolvedValue<PermissionEntity>(permission);
    repository.updateOne = TestMock.mockResolvedValue<UpdatedModel>(null);
    repository.existsOnUpdate = TestMock.mockResolvedValue<boolean>(false);

    await expect(usecase.execute(input)).resolves.toEqual(permission);
  });
});
