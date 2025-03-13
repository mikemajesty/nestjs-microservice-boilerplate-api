import { Test } from '@nestjs/testing';
import { TestMock } from 'test/mock';

import { ILoggerAdapter } from '@/infra/logger';
import { CreatedModel } from '@/infra/repository';
import { IPermissionCreateAdapter } from '@/modules/permission/adapter';
import { ApiConflictException } from '@/utils/exception';
import { ZodExceptionIssue } from '@/utils/validator';

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
            info: TestMock.mockReturnValue<void>()
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
    await TestMock.expectZodError(
      () => usecase.execute({} as PermissionCreateInput),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([{ message: 'Required', path: TestMock.nameOf<PermissionCreateInput>('name') }]);
      }
    );
  });

  const input: PermissionCreateInput = {
    name: 'name:permission'
  };

  const output: PermissionEntity = new PermissionEntity({ id: TestMock.getMockUUID(), name: input.name });

  test('when permission exists, should expect an error', async () => {
    repository.findOne = TestMock.mockResolvedValue<PermissionEntity>(output);

    await expect(usecase.execute(input)).rejects.toThrow(ApiConflictException);
  });

  test('when permission created successfully, should expect a permission created', async () => {
    repository.create = TestMock.mockResolvedValue<CreatedModel>({ created: true, id: TestMock.getMockUUID() });
    repository.findOne = TestMock.mockResolvedValue<PermissionEntity>(null);

    await expect(usecase.execute(input)).resolves.toBeInstanceOf(PermissionEntity);
  });
});
