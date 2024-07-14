import { Test } from '@nestjs/testing';

import { IRoleGetByIdAdapter } from '@/modules/role/adapter';
import { ApiNotFoundException } from '@/utils/exception';
import { expectZodError, getMockUUID } from '@/utils/tests';

import { IRoleRepository } from '../../repository/role';
import { RoleGetByIdInput, RoleGetByIdUsecase } from '../role-get-by-id';
import { RoleEntity, RoleEnum } from './../../entity/role';

describe(RoleGetByIdUsecase.name, () => {
  let usecase: IRoleGetByIdAdapter;
  let repository: IRoleRepository;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      providers: [
        {
          provide: IRoleRepository,
          useValue: {}
        },
        {
          provide: IRoleGetByIdAdapter,
          useFactory: (roleRepository: IRoleRepository) => {
            return new RoleGetByIdUsecase(roleRepository);
          },
          inject: [IRoleRepository]
        }
      ]
    }).compile();

    usecase = app.get(IRoleGetByIdAdapter);
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

  const input: RoleGetByIdInput = {
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

  test('when role found, should expect a role that has been found', async () => {
    repository.findById = jest.fn().mockResolvedValue(role);

    await expect(usecase.execute(input)).resolves.toEqual(role);
  });
});
