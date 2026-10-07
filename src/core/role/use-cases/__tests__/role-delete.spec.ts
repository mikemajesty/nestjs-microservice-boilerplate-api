/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/core/test.md
 */
import { ZodMockSchema } from '@mikemajesty/zod-mock-schema'
import { Test } from '@nestjs/testing'

import { PermissionEntity } from '@/core/permission/entity/permission'
import { RoleDeleteInput, RoleDeleteSchema, RoleDeleteUsecase } from '@/core/role/use-cases/role-delete'
import { ICacheAsideAdapter } from '@/infra/cache/aside'
import { CreatedModel } from '@/infra/repository'
import { IRoleDelete } from '@/modules/role/interfaces'
import { ApiConflictException, ApiNotFoundException } from '@/utils/exception'
import { TestUtils } from '@/utils/test/utils'
import { ZodExceptionIssue } from '@/utils/validator'

import { IRoleRepository } from '../../repository/role'
import { RoleEntity, RoleEntitySchema } from './../../entity/role'

describe(RoleDeleteUsecase.name, () => {
  let usecase: IRoleDelete
  let repository: IRoleRepository

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      providers: [
        TestUtils.mockProvider(IRoleRepository),
        TestUtils.mockProvider(ICacheAsideAdapter, {
          invalidate: TestUtils.mockResolvedValue()
        }),
        {
          provide: IRoleDelete,
          useFactory: (roleRepository: IRoleRepository, cacheAside: ICacheAsideAdapter) => {
            return new RoleDeleteUsecase(roleRepository, cacheAside)
          },
          inject: [IRoleRepository, ICacheAsideAdapter]
        }
      ]
    }).compile()

    usecase = app.get(IRoleDelete)
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
  const role: RoleEntity = roleEntityMock.generate({
    overrides: {
      deletedAt: null,
      permissions: []
    },
    factory: (data) => new RoleEntity(data)
  })

  test('when role has no permissions property, should delete successfully', async () => {
    const roleWithoutPermissions = { ...role, permissions: undefined }
    const roleEntityWithoutPermissions = new RoleEntity(roleWithoutPermissions)
    repository.findById = TestUtils.mockResolvedValue<RoleEntity>(roleEntityWithoutPermissions)
    repository.create = TestUtils.mockResolvedValue<CreatedModel>()

    await expect(usecase.execute(input)).resolves.toEqual({
      ...roleEntityWithoutPermissions.toData(),
      deletedAt: expect.any(Date),
      updatedAt: expect.any(Date)
    })
  })

  test('when role deleted successfully, should expect a role deleted', async () => {
    repository.findById = TestUtils.mockResolvedValue<RoleEntity>(role.clone())
    repository.create = TestUtils.mockResolvedValue<CreatedModel>()

    await expect(usecase.execute(input)).resolves.toEqual({
      ...role.toData(),
      deletedAt: expect.any(Date),
      updatedAt: expect.any(Date)
    })
  })
})
