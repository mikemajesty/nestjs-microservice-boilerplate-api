import { Test } from '@nestjs/testing';
import { TestMock } from 'test/mock';

import { ILoggerAdapter } from '@/infra/logger';
import { IRoleCreateAdapter } from '@/modules/role/adapter';
import { ZodExceptionIssue } from '@/utils/validator';

import { RoleEnum } from '../../entity/role';
import { IRoleRepository } from '../../repository/role';
import { RoleCreateInput, RoleCreateOutput, RoleCreateUsecase } from '../role-create';

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
            info: TestMock.mockReturnValue<void>()
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
    await TestMock.expectZodError(
      () => usecase.execute({} as RoleCreateInput),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([{ message: 'Required', path: TestMock.nameOf<RoleCreateInput>('name') }]);
      }
    );
  });

  const input: RoleCreateInput = {
    name: RoleEnum.USER
  };

  test('when role created successfully, should expect a role created', async () => {
    const output: RoleCreateOutput = { created: true, id: TestMock.getMockUUID() };
    repository.create = TestMock.mockResolvedValue<RoleCreateOutput>(output);

    await expect(usecase.execute(input)).resolves.toEqual(output);
  });
});
