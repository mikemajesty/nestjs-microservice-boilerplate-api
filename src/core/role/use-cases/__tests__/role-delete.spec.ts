import { ZodMockSchema } from '@mikemajesty/zod-mock-schema'
import { Test } from '@nestjs/testing'

import { PermissionEntity } from '@/core/permission/entity/permission'
import { RoleDeleteInput, RoleDeleteSchema, RoleDeleteUsecase } from '@/core/role/use-cases/role-delete'
import { CreatedModel } from '@/infra/repository'
import { IRoleDeleteAdapter } from '@/modules/role/adapter'
import { ApiConflictException, ApiNotFoundException } from '@/utils/exception'
import { TestUtils } from '@/utils/test/util'
import { ZodExceptionIssue } from '@/utils/validator'

import { IRoleRepository } from '../../repository/role'
import { RoleEntity, RoleEntitySchema } from './../../entity/role'

describe(RoleDeleteUsecase.name, () => {
  let usecase: IRoleDeleteAdapter
  let repository: IRoleRepository

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
            return new RoleDeleteUsecase(roleRepository)
          },
          inject: [IRoleRepository]
        }
      ]
    }).compile()

    usecase = app.get(IRoleDeleteAdapter)
    repository = app.get(IRoleRepository)
  })

  test('when no input is specified, should expect an error', async () => {
    await TestUtils.expectZodError(
      () => usecase.execute({} as RoleDeleteInput),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([
          {
            message: 'Invalid input: expected string, received undefined',
            path: TestUtils.nameOf<RoleDeleteInput>('id')
          }
        ])
      }
    )
  })

  const roleDeleteInputMock = new ZodMockSchema(RoleDeleteSchema)
  const input: RoleDeleteInput = roleDeleteInputMock.generate()

  test('when role not found, should expect an error', async () => {
    repository.findById = TestUtils.mockResolvedValue<RoleEntity>(null)

    await expect(usecase.execute(input)).rejects.toThrow(ApiNotFoundException)
  })

  test('when role has association with permission, should expect an error', async () => {
    repository.findById = TestUtils.mockResolvedValue<RoleEntity>({
      permissions: [{ name: 'create:cat' } as PermissionEntity]
    })

    await expect(usecase.execute(input)).rejects.toThrow(ApiConflictException)
  })

  const roleEntityMock = new ZodMockSchema(RoleEntitySchema)
  const role: RoleDeleteInput = roleEntityMock.generate({
    overrides: {
      deletedAt: null,
      permissions: []
    }
  })

  test('when role deleted successfully, should expect a role deleted', async () => {
    repository.findById = TestUtils.mockResolvedValue<RoleEntity>(role)
    repository.create = TestUtils.mockResolvedValue<CreatedModel>()

    await expect(usecase.execute(input)).resolves.toEqual({
      ...role,
      deletedAt: expect.any(Date)
    })
  })
})
