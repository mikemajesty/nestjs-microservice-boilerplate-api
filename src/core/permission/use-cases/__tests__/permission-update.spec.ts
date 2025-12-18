/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/core/test.md
 */
import { ZodMockSchema } from '@mikemajesty/zod-mock-schema'
import { Test } from '@nestjs/testing'

import { ILoggerAdapter } from '@/infra/logger'
import { UpdatedModel } from '@/infra/repository'
import { IPermissionUpdateAdapter } from '@/modules/permission/adapter'
import { ApiConflictException, ApiNotFoundException } from '@/utils/exception'
import { TestUtils } from '@/utils/test/util'
import { ZodExceptionIssue } from '@/utils/validator'

import { IPermissionRepository } from '../../repository/permission'
import { PermissionUpdateInput, PermissionUpdateSchema, PermissionUpdateUsecase } from '../permission-update'
import { PermissionEntity, PermissionEntitySchema } from './../../entity/permission'

describe(PermissionUpdateUsecase.name, () => {
  let usecase: IPermissionUpdateAdapter
  let repository: IPermissionRepository

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      providers: [
        {
          provide: IPermissionRepository,
          useValue: {}
        },
        {
          provide: ILoggerAdapter,
          useValue: {
            info: TestUtils.mockReturnValue<void>()
          }
        },
        {
          provide: IPermissionUpdateAdapter,
          useFactory: (permissionRepository: IPermissionRepository, logger: ILoggerAdapter) => {
            return new PermissionUpdateUsecase(permissionRepository, logger)
          },
          inject: [IPermissionRepository, ILoggerAdapter]
        }
      ]
    }).compile()

    usecase = app.get(IPermissionUpdateAdapter)
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
    repository.findById = TestUtils.mockResolvedValue<PermissionEntity>(null)

    await expect(usecase.execute(input)).rejects.toThrow(ApiNotFoundException)
  })

  const mock = new ZodMockSchema(PermissionEntitySchema)
  const permission = mock.generate<PermissionEntity>({
    overrides: {
      name: 'name:permission',
      roles: []
    }
  })
  test('when permission exists, should expect an error', async () => {
    repository.findById = TestUtils.mockResolvedValue<PermissionEntity>(permission)
    repository.existsOnUpdate = TestUtils.mockResolvedValue<boolean>(true)

    await expect(usecase.execute({ ...input, name: 'permission:create' })).rejects.toThrow(ApiConflictException)
  })

  test('when permission updated successfully, should expect a permission updated', async () => {
    repository.findById = TestUtils.mockResolvedValue<PermissionEntity>(permission)
    repository.updateOne = TestUtils.mockResolvedValue<UpdatedModel>(null)
    repository.existsOnUpdate = TestUtils.mockResolvedValue<boolean>(false)

    await expect(usecase.execute(input)).resolves.toBeDefined()
  })
})
