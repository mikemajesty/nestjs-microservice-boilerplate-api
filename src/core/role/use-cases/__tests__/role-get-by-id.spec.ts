import { Test } from '@nestjs/testing';
import { TestMock } from 'test/mock';

import { IRoleGetByIdAdapter } from '@/modules/role/adapter';
import { ApiNotFoundException } from '@/utils/exception';
import { ZodExceptionIssue } from '@/utils/validator';

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
    await TestMock.expectZodError(
      () => usecase.execute({} as RoleGetByIdInput),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([{ message: 'Required', path: TestMock.nameOf<RoleGetByIdInput>('id') }]);
      }
    );
  });

  const input: RoleGetByIdInput = {
    id: TestMock.getMockUUID()
  };

  test('when role not found, should expect an error', async () => {
    repository.findById = TestMock.mockResolvedValue<RoleEntity>(null);

    await expect(usecase.execute(input)).rejects.toThrow(ApiNotFoundException);
  });

  const role = new RoleEntity({
    id: TestMock.getMockUUID(),
    name: RoleEnum.USER
  });

  test('when role found, should expect a role found', async () => {
    repository.findById = TestMock.mockResolvedValue<RoleEntity>(role);

    await expect(usecase.execute(input)).resolves.toEqual(role);
  });
});
