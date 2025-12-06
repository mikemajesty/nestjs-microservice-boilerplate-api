import { ZodMockSchema } from '@mikemajesty/zod-mock-schema';
import { Test } from '@nestjs/testing';

import { ILoggerAdapter } from '@/infra/logger';
import { IRoleCreateAdapter } from '@/modules/role/adapter';
import { TestUtils } from '@/utils/test/util';
import { ZodExceptionIssue } from '@/utils/validator';

import { IRoleRepository } from '../../repository/role';
import { RoleCreateInput, RoleCreateOutput, RoleCreateSchema, RoleCreateUsecase } from '../role-create';

describe(RoleCreateUsecase.name, () => {
  let usecase: IRoleCreateAdapter;
  let repository: IRoleRepository;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      providers: [
        {
          provide: IRoleRepository,
          useValue: {}
        },
        {
          provide: ILoggerAdapter,
          useValue: {
            info: TestUtils.mockReturnValue<void>()
          }
        },
        {
          provide: IRoleCreateAdapter,
          useFactory: (roleRepository: IRoleRepository, logger: ILoggerAdapter) => {
            return new RoleCreateUsecase(roleRepository, logger);
          },
          inject: [IRoleRepository, ILoggerAdapter]
        }
      ]
    }).compile();

    usecase = app.get(IRoleCreateAdapter);
    repository = app.get(IRoleRepository);
  });

  test('when no input is specified, should expect an error', async () => {
    await TestUtils.expectZodError(
      () => usecase.execute({} as RoleCreateInput),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([{ message: 'Required', path: TestUtils.nameOf<RoleCreateInput>('name') }]);
      }
    );
  });

  const mock = new ZodMockSchema(RoleCreateSchema);
  const input = mock.generate();

  test('when role created successfully, should expect a role created', async () => {
    const output: RoleCreateOutput = { created: true, id: TestUtils.getMockUUID() };
    repository.create = TestUtils.mockResolvedValue<RoleCreateOutput>(output);

    await expect(usecase.execute(input)).resolves.toEqual(output);
  });
});
