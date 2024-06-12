import { Test } from '@nestjs/testing';

import { ILoggerAdapter } from '@/infra/logger';
import { IRoleCreateAdapter } from '@/modules/role/adapter';
import { expectZodError, getMockUUID } from '@/utils/tests';

import { RoleEntity, RoleEnum } from '../../entity/role';
import { IRoleRepository } from '../../repository/role';
import { RoleCreateInput, RoleCreateOutput, RoleCreateUsecase } from '../role-create';

const successInput: RoleCreateInput = {
  name: RoleEnum.USER
};

const failureInput: RoleCreateInput = {};

describe('RoleCreateUsecase', () => {
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
            info: jest.fn()
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
    await expectZodError(
      () => usecase.execute(failureInput),
      (issues) => {
        expect(issues).toEqual([{ message: 'Required', path: RoleEntity.nameOf('name') }]);
      }
    );
  });

  test('when role created successfully, should expect a role that has been created', async () => {
    const createOutput: RoleCreateOutput = { created: true, id: getMockUUID() };

    repository.create = jest.fn().mockResolvedValue(createOutput);

    await expect(usecase.execute(successInput)).resolves.toEqual(createOutput);
  });
});
