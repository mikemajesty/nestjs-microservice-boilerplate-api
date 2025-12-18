/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/main/guides/core/test.md
 */
import { ZodMockSchema } from '@mikemajesty/zod-mock-schema'
import { Test } from '@nestjs/testing'

import {
  PermissionDeleteInput,
  PermissionDeleteSchema,
  PermissionDeleteUsecase
} from '@/core/permission/use-cases/permission-delete'
import { RoleEntity, RoleEnum } from '@/core/role/entity/role'
import { CreatedModel } from '@/infra/repository'
import { IPermissionDeleteAdapter } from '@/modules/permission/adapter'
import { ApiConflictException, ApiNotFoundException } from '@/utils/exception'
import { TestUtils } from '@/utils/test/util'
import { ZodExceptionIssue } from '@/utils/validator'

import { IPermissionRepository } from '../../repository/permission'
import { PermissionEntity, PermissionEntitySchema } from './../../entity/permission'

describe(PermissionDeleteUsecase.name, () => {
  let usecase: IPermissionDeleteAdapter
  let repository: IPermissionRepository

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      providers: [
        {
          provide: IPermissionRepository,
          useValue: {}
        },
        {
          provide: IPermissionDeleteAdapter,
          useFactory: (permissionRepository: IPermissionRepository) => {
            return new PermissionDeleteUsecase(permissionRepository)
          },
          inject: [IPermissionRepository]
        }
      ]
    }).compile()

    usecase = app.get(IPermissionDeleteAdapter)
    repository = app.get(IPermissionRepository)
  })

  test('when no input is specified, should expect an error', async () => {
    await TestUtils.expectZodError(
      () => usecase.execute({} as PermissionDeleteInput),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([
          {
            message: 'Invalid input: expected string, received undefined',
            path: TestUtils.nameOf<PermissionDeleteInput>('id')
          }
        ])
      }
    )
  })

  const permissionDeleteSchemaMock = new ZodMockSchema(PermissionDeleteSchema)
  const input: PermissionDeleteInput = permissionDeleteSchemaMock.generate()

  test('when permission not found, should expect an error', async () => {
    repository.findOneWithRelation = TestUtils.mockResolvedValue<PermissionEntity>(null)

    await expect(usecase.execute(input)).rejects.toThrow(ApiNotFoundException)
  })

  test('when permission has association with role, should expect an error', async () => {
    repository.findOneWithRelation = TestUtils.mockResolvedValue<PermissionEntity>({
      roles: [{ name: RoleEnum.BACKOFFICE } as RoleEntity]
    })

    await expect(usecase.execute(input)).rejects.toThrow(ApiConflictException)
  })

  const mock = new ZodMockSchema(PermissionEntitySchema)
  const permission = mock.generate<PermissionEntity>({
    overrides: {
      name: 'name:permission',
      roles: []
    }
  })

  test('when permission deleted successfully, should expect a permission deleted', async () => {
    repository.findOneWithRelation = TestUtils.mockResolvedValue<PermissionEntity>(permission)
    repository.create = TestUtils.mockResolvedValue<CreatedModel>()

    await expect(usecase.execute(input)).resolves.toEqual({
      ...permission,
      deletedAt: expect.any(Date)
    })
  })
})
