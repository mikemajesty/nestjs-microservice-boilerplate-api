import { Test } from '@nestjs/testing';
import { TestMock } from 'test/mock';

import { PermissionEntity } from '@/core/permission/entity/permission';
import { RoleDeleteInput, RoleDeleteUsecase } from '@/core/role/use-cases/role-delete';
import { CreatedModel } from '@/infra/repository';
import { IRoleDeleteAdapter } from '@/modules/role/adapter';
import { ApiConflictException, ApiNotFoundException } from '@/utils/exception';
import { ZodExceptionIssue } from '@/utils/validator';

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
    await TestMock.expectZodError(
      () => usecase.execute({} as RoleDeleteInput),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([{ message: 'Required', path: TestMock.nameOf<RoleDeleteInput>('id') }]);
      }
    );
  });

  const input: RoleDeleteInput = {
    id: TestMock.getMockUUID()
  };

  test('when role not found, should expect an error', async () => {
    repository.findById = TestMock.mockResolvedValue<RoleEntity>(null);

    await expect(usecase.execute(input)).rejects.toThrow(ApiNotFoundException);
  });

  test('when role has association with permission, should expect an error', async () => {
    repository.findById = TestMock.mockResolvedValue<RoleEntity>({
      permissions: [{ name: 'create:cat' } as PermissionEntity]
    });

    await expect(usecase.execute(input)).rejects.toThrow(ApiConflictException);
  });

  const role = new RoleEntity({
    id: TestMock.getMockUUID(),
    name: RoleEnum.USER
  });

  test('when role deleted successfully, should expect a role deleted', async () => {
    repository.findById = TestMock.mockResolvedValue<RoleEntity>(role);
    repository.create = TestMock.mockResolvedValue<CreatedModel>();

    await expect(usecase.execute(input)).resolves.toEqual({
      ...role,
      deletedAt: expect.any(Date)
    });
  });
});
