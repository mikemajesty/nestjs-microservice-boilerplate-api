import { Test } from '@nestjs/testing';
import { TestMock } from 'test/mock';

import { RoleListInput, RoleListOutput, RoleListUsecase } from '@/core/role/use-cases/role-list';
import { IRoleListAdapter } from '@/modules/role/adapter';
import { ZodExceptionIssue } from '@/utils/validator';

import { IRoleRepository } from '../../repository/role';
import { RoleEntity, RoleEnum } from './../../entity/role';

describe(RoleListUsecase.name, () => {
  let usecase: IRoleListAdapter;
  let repository: IRoleRepository;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      providers: [
        {
          provide: IRoleRepository,
          useValue: {}
        },
        {
          provide: IRoleListAdapter,
          useFactory: (roleRepository: IRoleRepository) => {
            return new RoleListUsecase(roleRepository);
          },
          inject: [IRoleRepository]
        }
      ]
    }).compile();

    usecase = app.get(IRoleListAdapter);
    repository = app.get(IRoleRepository);
  });

  test('when sort input is specified, should expect an error', async () => {
    await TestMock.expectZodError(
      () => usecase.execute({} as RoleListInput),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([{ message: 'Required', path: TestMock.nameOf<RoleListInput>('search') }]);
      }
    );
  });

  const input: RoleListInput = { limit: 1, page: 1, search: {}, sort: { createdAt: -1 } };

  const role = new RoleEntity({
    id: TestMock.getMockUUID(),
    name: RoleEnum.USER,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  test('when role are found, should expect an role list', async () => {
    const output: RoleListOutput = { docs: [role], page: 1, limit: 1, total: 1 };
    repository.paginate = TestMock.mockResolvedValue<RoleListOutput>(output);

    await expect(usecase.execute(input)).resolves.toEqual({
      docs: [role],
      page: 1,
      limit: 1,
      total: 1
    });
  });

  test('when role not found, should expect an empty list', async () => {
    const output: RoleListOutput = { docs: [], page: 1, limit: 1, total: 1 };
    repository.paginate = TestMock.mockResolvedValue<RoleListOutput>(output);

    await expect(usecase.execute(input)).resolves.toEqual(output);
  });
});
