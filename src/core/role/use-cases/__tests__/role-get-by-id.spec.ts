/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/core/test.md
 */
import { ZodMockSchema } from '@mikemajesty/zod-mock-schema'
import { Test } from '@nestjs/testing'

import { IRoleGetById } from '@/modules/role/interfaces'
import { ApiNotFoundException } from '@/utils/exception'
import { TestUtils } from '@/utils/test/utils'
import { ZodExceptionIssue } from '@/utils/validator'

import { IRoleRepository } from '../../repository/role'
import { RoleGetByIdInput, RoleGetByIdSchema, RoleGetByIdUsecase } from '../role-get-by-id'
import { RoleEntity, RoleEntitySchema } from './../../entity/role'

describe(RoleGetByIdUsecase.name, () => {
  let usecase: IRoleGetById
  let repository: IRoleRepository

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      providers: [
        TestUtils.mockProvider(IRoleRepository),
        {
          provide: IRoleGetById,
          useFactory: (roleRepository: IRoleRepository) => {
            return new RoleGetByIdUsecase(roleRepository)
          },
          inject: [IRoleRepository]
        }
      ]
    }).compile()

    usecase = app.get(IRoleGetById)
    repository = app.get(IRoleRepository)
  })

  test('when no input is specified, should expect an error', async () => {
    await TestUtils.expectZodError(
      () => usecase.execute({} as RoleGetByIdInput),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([
          {
            message: 'Invalid input: expected string, received undefined',
            path: TestUtils.nameOf<RoleGetByIdInput>('id')
          }
        ])
      }
    )
  })

  const roleRoleGetByIdSchemaMock = new ZodMockSchema(RoleGetByIdSchema)
  const input: RoleGetByIdInput = roleRoleGetByIdSchemaMock.generate()

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

  test('when role found, should expect a role found', async () => {
    repository.findById = TestUtils.mockResolvedValue<RoleEntity>(role.clone())

    await expect(usecase.execute(input)).resolves.toEqual(role.toData())
  })
})
