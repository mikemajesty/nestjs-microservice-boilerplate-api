/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/core/test.md
 */
import { ZodMockSchema } from '@mikemajesty/zod-mock-schema'
import { Test } from '@nestjs/testing'

import { ILoggerAdapter } from '@/infra/logger'
import { CreatedModel } from '@/infra/repository'
import { IPermissionCreate } from '@/modules/permission/interfaces'
import { ApiConflictException } from '@/utils/exception'
import { MockUtils, TestUtils } from '@/utils/test'
import { ZodExceptionIssue } from '@/utils/validator'

import { PermissionEntity, PermissionEntitySchema } from '../../entity/permission'
import { IPermissionRepository } from '../../repository/permission'
import { PermissionCreateInput, PermissionCreateSchema, PermissionCreateUsecase } from '../permission-create'

describe(PermissionCreateUsecase.name, () => {
  let usecase: IPermissionCreate
  let repository: IPermissionRepository

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      providers: [
        TestUtils.mockProvider(IPermissionRepository),
        TestUtils.mockProvider(ILoggerAdapter, {
          info: TestUtils.mockReturnValue()
        }),
        {
          provide: IPermissionCreate,
          useFactory: (permissionRepository: IPermissionRepository, logger: ILoggerAdapter) => {
            return new PermissionCreateUsecase(permissionRepository, logger)
          },
          inject: [IPermissionRepository, ILoggerAdapter]
        }
      ]
    }).compile()

    usecase = app.get(IPermissionCreate)
    repository = app.get(IPermissionRepository)
  })

  test('when no input is specified, should expect an error', async () => {
    await TestUtils.expectZodError(
      () => usecase.execute({} as PermissionCreateInput),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([
          {
            message: 'Invalid input: expected string, received undefined',
            path: TestUtils.nameOf<PermissionCreateInput>('name')
          }
        ])
      }
    )
  })

  const permissionCreateSchemaMock = new ZodMockSchema(PermissionCreateSchema)
  const input = permissionCreateSchemaMock.generate<PermissionCreateInput>({
    overrides: {
      name: 'create:permission'
    }
  })

  const mock = new ZodMockSchema(PermissionEntitySchema)
  const output = mock.generate({
    overrides: {
      name: 'create:permission'
    },
    factory: (data) => new PermissionEntity(data)
  })

  test('when permission exists, should expect an error', async () => {
    repository.findOne = TestUtils.mockResolvedValue<PermissionEntity>(output.clone())

    await expect(usecase.execute(input)).rejects.toThrow(ApiConflictException)
  })

  test('when permission created successfully, should expect a permission created', async () => {
    repository.create = TestUtils.mockResolvedValue<CreatedModel>({ created: true, id: MockUtils.UUID() })
    repository.findOne = TestUtils.mockResolvedValue<PermissionEntity>(null)

    await expect(usecase.execute(input)).resolves.toBeDefined()
  })
})
