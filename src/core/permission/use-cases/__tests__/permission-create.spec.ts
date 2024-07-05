import { Test } from '@nestjs/testing';

import { ILoggerAdapter } from '@/infra/logger';
import { IPermissionCreateAdapter } from '@/modules/permission/adapter';
import { expectZodError, getMockUUID } from '@/utils/tests';

import { PermissionEntity } from '../../entity/permission';
import { IPermissionRepository } from '../../repository/permission';
import { PermissionCreateInput, PermissionCreateOutput, PermissionCreateUsecase } from '../permission-create';

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
    name: 'all'
  };

  test('when permission created successfully, should expect a permission that has been created', async () => {
    const output: PermissionCreateOutput = { created: true, id: getMockUUID() };
    repository.create = jest.fn().mockResolvedValue(output);

    await expect(usecase.execute(input)).resolves.toEqual(output);
  });
});
