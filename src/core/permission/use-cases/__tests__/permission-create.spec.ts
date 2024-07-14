import { Test } from '@nestjs/testing';

import { ILoggerAdapter } from '@/infra/logger';
import { IPermissionCreateAdapter } from '@/modules/permission/adapter';
import { ApiConflictException } from '@/utils/exception';
import { expectZodError, getMockUUID } from '@/utils/tests';

import { PermissionEntity } from '../../entity/permission';
import { IPermissionRepository } from '../../repository/permission';
import { PermissionCreateInput, PermissionCreateUsecase } from '../permission-create';

describe(PermissionCreateUsecase.name, () => {
  let usecase: IPermissionCreateAdapter;
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
          provide: IPermissionCreateAdapter,
          useFactory: (permissionRepository: IPermissionRepository, logger: ILoggerAdapter) => {
            return new PermissionCreateUsecase(permissionRepository, logger);
          },
          inject: [IPermissionRepository, ILoggerAdapter]
        }
      ]
    }).compile();

    usecase = app.get(IPermissionCreateAdapter);
    repository = app.get(IPermissionRepository);
  });

  test('when no input is specified, should expect an error', async () => {
    await expectZodError(
      () => usecase.execute({}),
      (issues) => {
        expect(issues).toEqual([{ message: 'Required', path: PermissionEntity.nameOf('name') }]);
      }
    );
  });

  const input: PermissionCreateInput = {
    name: 'name:permission'
  };

  const output: PermissionEntity = new PermissionEntity({ id: getMockUUID(), name: input.name });

  test('when permission exists, should expect an error', async () => {
    repository.findOne = jest.fn().mockResolvedValue(output);

    await expect(usecase.execute(input)).rejects.toThrow(ApiConflictException);
  });

  test('when permission created successfully, should expect a permission that has been created', async () => {
    repository.create = jest.fn().mockResolvedValue(true);
    repository.findOne = jest.fn().mockResolvedValue(null);

    await expect(usecase.execute(input)).resolves.toBeInstanceOf(PermissionEntity);
  });
});
