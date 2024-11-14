import { Test } from '@nestjs/testing';
import { ZodIssue } from 'zod';

import { ILoggerAdapter } from '@/infra/logger';
import { IRoleCreateAdapter } from '@/modules/role/adapter';
import { TestUtils } from '@/utils/tests';

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
      (issues: ZodIssue[]) => {
        expect(issues).toEqual([{ message: 'Required', path: TestUtils.nameOf<RoleCreateInput>('name') }]);
      }
    );
  });

  const input: RoleCreateInput = {
    name: RoleEnum.USER
  };

  test('when role created successfully, should expect a role that has been created', async () => {
    const output: RoleCreateOutput = { created: true, id: TestUtils.getMockUUID() };
    repository.create = TestUtils.mockResolvedValue<RoleCreateOutput>(output);

    await expect(usecase.execute(input)).resolves.toEqual(output);
  });
});
