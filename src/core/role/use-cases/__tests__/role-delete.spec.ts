import { Test } from '@nestjs/testing';

import { RoleDeleteInput, RoleDeleteUsecase } from '@/core/role/use-cases/role-delete';
import { IRoleDeleteAdapter } from '@/modules/role/adapter';
import { ApiNotFoundException } from '@/utils/exception';
import { expectZodError, getMockUUID } from '@/utils/tests';

import { IRoleRepository } from '../../repository/role';
import { RoleEntity, RoleEnum } from './../../entity/role';

describe(RoleDeleteUsecase.name, () => {
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
      () => usecase.execute({}),
      (issues) => {
        expect(issues).toEqual([{ message: 'Required', path: RoleEntity.nameOf('id') }]);
      }
    );
  });

  const input: RoleDeleteInput = {
    id: getMockUUID()
  };

  test('when role not found, should expect an error', async () => {
    repository.findById = jest.fn().mockResolvedValue(null);

    await expect(usecase.execute(input)).rejects.toThrow(ApiNotFoundException);
  });

  const role = new RoleEntity({
    id: getMockUUID(),
    name: RoleEnum.USER
  });

  test('when role deleted successfully, should expect a role that has been deleted', async () => {
    repository.findById = jest.fn().mockResolvedValue(role);
    repository.updateOne = jest.fn();

    await expect(usecase.execute(input)).resolves.toEqual({
      ...role,
      deletedAt: expect.any(Date)
    });
  });
});
