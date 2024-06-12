import { Test } from '@nestjs/testing';

import { ILoggerAdapter } from '@/infra/logger';
import { IRoleUpdateAdapter } from '@/modules/role/adapter';
import { ApiNotFoundException } from '@/utils/exception';
import { expectZodError, getMockUUID } from '@/utils/tests';

import { IRoleRepository } from '../../repository/role';
import { RoleUpdateInput, RoleUpdateOutput, RoleUpdateUsecase } from '../role-update';
import { RoleEntity, RoleEnum } from './../../entity/role';

const successInput: RoleUpdateInput = {
  id: getMockUUID()
};

const failureInput: RoleUpdateInput = {};

describe('RoleUpdateUsecase', () => {
  let usecase: IRoleUpdateAdapter;
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
          provide: IRoleUpdateAdapter,
          useFactory: (roleRepository: IRoleRepository, logger: ILoggerAdapter) => {
            return new RoleUpdateUsecase(roleRepository, logger);
          },
          inject: [IRoleRepository, ILoggerAdapter]
        }
      ]
    }).compile();

    usecase = app.get(IRoleUpdateAdapter);
    repository = app.get(IRoleRepository);
  });

  test('when no input is specified, should expect an error', async () => {
    await expectZodError(
      () => usecase.execute(failureInput),
      (issues) => {
        expect(issues).toEqual([{ message: 'Required', path: RoleEntity.nameOf('id') }]);
      }
    );
  });

  test('when role not found, should expect an error', async () => {
    repository.findById = jest.fn().mockResolvedValue(null);

    await expect(usecase.execute(successInput)).rejects.toThrowError(ApiNotFoundException);
  });

  test('when role updated successfully, should expect an role that has been updated', async () => {
    const findByIdOutput: RoleUpdateOutput = new RoleEntity({
      id: getMockUUID(),
      name: RoleEnum.USER
    });

    repository.findById = jest.fn().mockResolvedValue(findByIdOutput);
    repository.updateOne = jest.fn().mockResolvedValue(null);

    await expect(usecase.execute(successInput)).resolves.toEqual(findByIdOutput);
  });
});
