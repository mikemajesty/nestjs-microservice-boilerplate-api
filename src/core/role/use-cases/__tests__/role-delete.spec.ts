import { Test } from '@nestjs/testing';

import { RoleDeleteInput, RoleDeleteOutput, RoleDeleteUsecase } from '@/core/role/use-cases/role-delete';
import { IRoleDeleteAdapter } from '@/modules/role/adapter';
import { ApiNotFoundException } from '@/utils/exception';
import { expectZodError, getMockUUID } from '@/utils/tests';

import { IRoleRepository } from '../../repository/role';
import { RoleEntity, RoleEnum } from './../../entity/role';

const successInput: RoleDeleteInput = {
  id: getMockUUID()
};

const failureInput: RoleDeleteInput = {};

describe('RoleDeleteUsecase', () => {
  let usecase: IRoleDeleteAdapter;
  let repository: IRoleRepository;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      providers: [
        {
          provide: IRoleRepository,
          useValue: {}
        },
        {
          provide: IRoleDeleteAdapter,
          useFactory: (roleRepository: IRoleRepository) => {
            return new RoleDeleteUsecase(roleRepository);
          },
          inject: [IRoleRepository]
        }
      ]
    }).compile();

    usecase = app.get(IRoleDeleteAdapter);
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

  test('when role deleted successfully, should expect a role that has been deleted', async () => {
    const findByIdOutput: RoleDeleteOutput = new RoleEntity({
      id: getMockUUID(),
      name: RoleEnum.USER
    });

    repository.findById = jest.fn().mockResolvedValue(findByIdOutput);
    repository.updateOne = jest.fn();

    await expect(usecase.execute(successInput)).resolves.toEqual({
      ...findByIdOutput,
      deletedAt: expect.any(Date)
    });
  });
});
