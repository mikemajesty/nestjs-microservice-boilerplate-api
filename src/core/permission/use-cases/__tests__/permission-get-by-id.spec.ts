/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/core/test.md
 */
import { ZodMockSchema } from '@mikemajesty/zod-mock-schema'
import { Test } from '@nestjs/testing'

import { IPermissionGetByIdAdapter } from '@/modules/permission/adapter'
import { ApiNotFoundException } from '@/utils/exception'
import { TestUtils } from '@/utils/test/utils'
import { ZodExceptionIssue } from '@/utils/validator'

import { IPermissionRepository } from '../../repository/permission'
import { PermissionGetByIdInput, PermissionGetByIdSchema, PermissionGetByIdUsecase } from '../permission-get-by-id'
import { PermissionEntity, PermissionEntitySchema } from './../../entity/permission'

describe(PermissionGetByIdUsecase.name, () => {
  let usecase: IPermissionGetByIdAdapter
  let repository: IPermissionRepository

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      providers: [
        {
          provide: IPermissionRepository,
          useValue: {}
        },
        {
          provide: IPermissionGetByIdAdapter,
          useFactory: (permissionRepository: IPermissionRepository) => {
            return new PermissionGetByIdUsecase(permissionRepository)
          },
          inject: [IPermissionRepository]
        }
      ]
    }).compile()

    usecase = app.get(IPermissionGetByIdAdapter)
    repository = app.get(IPermissionRepository)
  })

  test('when no input is specified, should expect an error', async () => {
    await TestUtils.expectZodError(
      () => usecase.execute({} as PermissionGetByIdInput),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([
          {
            message: 'Invalid input: expected string, received undefined',
            path: TestUtils.nameOf<PermissionGetByIdInput>('id')
          }
        ])
      }
    )
  })

  const permissionGetByIdSchemaMock = new ZodMockSchema(PermissionGetByIdSchema)
  const input: PermissionGetByIdInput = permissionGetByIdSchemaMock.generate()

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

  test('when permission found, should expect a permission found', async () => {
    repository.findById = TestUtils.mockResolvedValue<PermissionEntity>(permission)

    await expect(usecase.execute(input)).resolves.toEqual(permission)
  })
})
