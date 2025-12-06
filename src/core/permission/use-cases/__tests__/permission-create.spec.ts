import { ZodMockSchema } from '@mikemajesty/zod-mock-schema';
import { Test } from '@nestjs/testing';

import { ILoggerAdapter } from '@/infra/logger';
import { CreatedModel } from '@/infra/repository';
import { IPermissionCreateAdapter } from '@/modules/permission/adapter';
import { ApiConflictException } from '@/utils/exception';
import { TestUtils } from '@/utils/test/util';
import { ZodExceptionIssue } from '@/utils/validator';

import { PermissionEntity, PermissionEntitySchema } from '../../entity/permission';
import { IPermissionRepository } from '../../repository/permission';
import { PermissionCreateInput, PermissionCreateSchema, PermissionCreateUsecase } from '../permission-create';

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
            info: TestUtils.mockReturnValue<void>()
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
    await TestUtils.expectZodError(
      () => usecase.execute({} as PermissionCreateInput),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([{ message: 'Required', path: TestUtils.nameOf<PermissionCreateInput>('name') }]);
      }
    );
  });

  const permissionCreateSchemaMock = new ZodMockSchema(PermissionCreateSchema);
  const input = permissionCreateSchemaMock.generate<PermissionCreateInput>({
    overrides: {
      name: 'create:permission'
    }
  });

  const mock = new ZodMockSchema(PermissionEntitySchema);
  const output = mock.generate<PermissionEntity>({
    overrides: {
      name: 'create:permission'
    }
  });

  test('when permission exists, should expect an error', async () => {
    repository.findOne = TestUtils.mockResolvedValue<PermissionEntity>(output);

    await expect(usecase.execute(input)).rejects.toThrow(ApiConflictException);
  });

  test('when permission created successfully, should expect a permission created', async () => {
    repository.create = TestUtils.mockResolvedValue<CreatedModel>({ created: true, id: TestUtils.getMockUUID() });
    repository.findOne = TestUtils.mockResolvedValue<PermissionEntity>(null);

    await expect(usecase.execute(input)).resolves.toBeDefined();
  });
});
