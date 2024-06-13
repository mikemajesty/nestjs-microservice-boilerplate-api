import { Test } from '@nestjs/testing';

import { IRoleGetByIDAdapter } from '@/modules/role/adapter';
import { ApiNotFoundException } from '@/utils/exception';
import { expectZodError, getMockUUID } from '@/utils/tests';

import { IRoleRepository } from '../../repository/role';
import { RoleGetByIDInput, RoleGetByIDOutput, RoleGetByIdUsecase } from '../role-get-by-id';
import { RoleEntity, RoleEnum } from './../../entity/role';

describe(RoleGetByIdUsecase.name, () => {
  let usecase: IRoleGetByIDAdapter;
  let repository: IRoleRepository;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      providers: [
        {
          provide: IRoleRepository,
          useValue: {}
        },
        {
          provide: IRoleGetByIDAdapter,
          useFactory: (roleRepository: IRoleRepository) => {
            return new RoleGetByIdUsecase(roleRepository);
          },
          inject: [IRoleRepository]
        }
      ]
    }).compile();

    usecase = app.get(IRoleGetByIDAdapter);
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

  const input: RoleGetByIDInput = {
    id: getMockUUID()
  };

  test('when role not found, should expect an error', async () => {
    repository.findById = jest.fn().mockResolvedValue(null);

    await expect(usecase.execute(input)).rejects.toThrowError(ApiNotFoundException);
  });

  test('when role found, should expect a role that has been found', async () => {
    const findByIdOutput: RoleGetByIDOutput = new RoleEntity({
      id: getMockUUID(),
      name: RoleEnum.USER
    });
    repository.findById = jest.fn().mockResolvedValue(findByIdOutput);

    await expect(usecase.execute(input)).resolves.toEqual(findByIdOutput);
  });
});
