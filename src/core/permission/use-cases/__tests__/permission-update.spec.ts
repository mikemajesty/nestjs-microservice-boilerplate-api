/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/core/test.md
 */
import { ZodMockSchema } from '@mikemajesty/zod-mock-schema'
import { Test } from '@nestjs/testing'

import { RoleEntity } from '@/core/role/entity/role'
import { ICacheAsideAdapter } from '@/infra/cache/aside'
import { ILoggerAdapter } from '@/infra/logger'
import { UpdatedModel } from '@/infra/repository'
import { IPermissionUpdate } from '@/modules/permission/interfaces'
import { ApiConflictException, ApiNotFoundException } from '@/utils/exception'
import { IDGeneratorUtils } from '@/utils/id-generator'
import { TestUtils } from '@/utils/test/utils'
import { ZodExceptionIssue } from '@/utils/validator'

import { IPermissionRepository } from '../../repository/permission'
import { PermissionUpdateInput, PermissionUpdateSchema, PermissionUpdateUsecase } from '../permission-update'
import { PermissionEntity, PermissionEntitySchema } from './../../entity/permission'

describe(PermissionUpdateUsecase.name, () => {
  let usecase: IPermissionUpdate
  let repository: IPermissionRepository

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      providers: [
        TestUtils.mockProvider(IPermissionRepository),
        TestUtils.mockProvider(ILoggerAdapter, {
          info: TestUtils.mockReturnValue()
        }),
        TestUtils.mockProvider(ICacheAsideAdapter, {
          invalidateMany: TestUtils.mockResolvedValue()
        }),
        {
          provide: IPermissionUpdate,
          useFactory: (
            permissionRepository: IPermissionRepository,
            logger: ILoggerAdapter,
            cacheAside: ICacheAsideAdapter
          ) => {
            return new PermissionUpdateUsecase(permissionRepository, logger, cacheAside)
          },
          inject: [IPermissionRepository, ILoggerAdapter, ICacheAsideAdapter]
        }
      ]
    }).compile()

    usecase = app.get(IPermissionUpdate)
    repository = app.get(IPermissionRepository)
  })

  test('when no input is specified, should expect an error', async () => {
    await TestUtils.expectZodError(
      () => usecase.execute({} as PermissionUpdateInput),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([
          {
            message: 'Invalid input: expected string, received undefined',
            path: TestUtils.nameOf<PermissionUpdateInput>('id')
          }
        ])
      }
    )
  })

  const permissionUpdateSchemaMock = new ZodMockSchema(PermissionUpdateSchema)
  const input: PermissionUpdateInput = permissionUpdateSchemaMock.generate({
    overrides: {
      name: 'permission:create'
    }
  })

  test('when permission not found, should expect an error', async () => {
    repository.findOneWithRelation = TestUtils.mockResolvedValue<PermissionEntity>(null)

    await expect(usecase.execute(input)).rejects.toThrow(ApiNotFoundException)
  })

  const mock = new ZodMockSchema(PermissionEntitySchema)
  const permission = mock.generate<PermissionEntity>({
    overrides: {
      name: 'name:permission',
      roles: [new RoleEntity({ id: IDGeneratorUtils.generate(), name: 'role:name' })]
    }
  })
  test('when permission exists, should expect an error', async () => {
    repository.findOneWithRelation = TestUtils.mockResolvedValue<PermissionEntity>(permission)
    repository.existsOnUpdate = TestUtils.mockResolvedValue<boolean>(true)

    await expect(usecase.execute({ ...input, name: 'permission:create' })).rejects.toThrow(ApiConflictException)
  })

  test('when permission updated successfully, should expect a permission updated', async () => {
    repository.findOneWithRelation = TestUtils.mockResolvedValue<PermissionEntity>(permission)
    repository.updateOne = TestUtils.mockResolvedValue<UpdatedModel>(null)
    repository.existsOnUpdate = TestUtils.mockResolvedValue<boolean>(false)

    await expect(usecase.execute(input)).resolves.toBeDefined()
  })

  test('when name is not provided, should update without checking for duplicates', async () => {
    const inputWithoutName = permissionUpdateSchemaMock.generate({
      overrides: {
        name: undefined
      }
    })
    repository.findOneWithRelation = TestUtils.mockResolvedValue<PermissionEntity>(permission)
    repository.updateOne = TestUtils.mockResolvedValue<UpdatedModel>(null)

    await expect(usecase.execute(inputWithoutName)).resolves.toBeDefined()
  })
})
