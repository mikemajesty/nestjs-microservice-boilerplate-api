/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/core/test.md
 */
import { ZodMockSchema } from '@mikemajesty/zod-mock-schema'
import { Test } from '@nestjs/testing'

import { ILoggerAdapter } from '@/infra/logger'
import { CreatedModel } from '@/infra/repository'
import { IRoleUpdate } from '@/modules/role/interfaces'
import { ApiNotFoundException } from '@/utils/exception'
import { TestUtils } from '@/utils/test/utils'
import { ZodExceptionIssue } from '@/utils/validator'

import { IRoleRepository } from '../../repository/role'
import { RoleUpdateInput, RoleUpdateSchema, RoleUpdateUsecase } from '../role-update'
import { RoleEntity, RoleEntitySchema } from './../../entity/role'

describe(RoleUpdateUsecase.name, () => {
  let usecase: IRoleUpdate
  let repository: IRoleRepository

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      providers: [
        TestUtils.mockProvider(IRoleRepository),
        TestUtils.mockProvider(ILoggerAdapter, {
          info: TestUtils.mockReturnValue<void>()
        }),
        {
          provide: IRoleUpdate,
          useFactory: (roleRepository: IRoleRepository, logger: ILoggerAdapter) => {
            return new RoleUpdateUsecase(roleRepository, logger)
          },
          inject: [IRoleRepository, ILoggerAdapter]
        }
      ]
    }).compile()

    usecase = app.get(IRoleUpdate)
    repository = app.get(IRoleRepository)
  })

  test('when no input is specified, should expect an error', async () => {
    await TestUtils.expectZodError(
      () => usecase.execute({} as RoleUpdateInput),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([
          {
            message: 'Invalid input: expected string, received undefined',
            path: TestUtils.nameOf<RoleUpdateInput>('id')
          }
        ])
      }
    )
  })

  const roleRoleGetByIdSchemaMock = new ZodMockSchema(RoleUpdateSchema)
  const input: RoleUpdateInput = roleRoleGetByIdSchemaMock.generate()

  test('when role not found, should expect an error', async () => {
    repository.findById = TestUtils.mockResolvedValue<RoleEntity>(null)

    await expect(usecase.execute(input)).rejects.toThrow(ApiNotFoundException)
  })

  const roleEntityMock = new ZodMockSchema(RoleEntitySchema)
  const role: RoleEntity = roleEntityMock.generate({
    overrides: {
      permissions: []
    },
    factory: (data) => new RoleEntity(data)
  })

  test('when role updated successfully, should expect a role updated', async () => {
    repository.findById = TestUtils.mockResolvedValueOnce<RoleEntity>(role.clone()).mockResolvedValue(role.clone())
    repository.create = TestUtils.mockResolvedValue<CreatedModel>(null)

    await expect(usecase.execute(input)).resolves.toEqual(role.toData())
  })
})
