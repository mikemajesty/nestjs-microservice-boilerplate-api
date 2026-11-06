/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/core/test.md
 */
import { ZodMockSchema } from '@mikemajesty/zod-mock-schema'
import { Test } from '@nestjs/testing'

import { RoleListOutput, RoleListSchema, RoleListUsecase } from '@/core/role/use-cases/role-list'
import { IRoleList } from '@/modules/role/interfaces'
import { TestUtils } from '@/utils/test/utils'

import { IRoleRepository } from '../../repository/role'
import { RoleEntity, RoleEntitySchema } from './../../entity/role'

describe(RoleListUsecase.name, () => {
  let usecase: IRoleList
  let repository: IRoleRepository

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      providers: [
        TestUtils.mockProvider(IRoleRepository),
        {
          provide: IRoleList,
          useFactory: (roleRepository: IRoleRepository) => {
            return new RoleListUsecase(roleRepository)
          },
          inject: [IRoleRepository]
        }
      ]
    }).compile()

    usecase = app.get(IRoleList)
    repository = app.get(IRoleRepository)
  })

  const input = new ZodMockSchema(RoleListSchema).generate()
  const roleEntityMock = new ZodMockSchema(RoleEntitySchema)
  const roles: RoleEntity[] = roleEntityMock.generateMany(10, {
    overrides: {
      permissions: []
    },
    factory: (data) => new RoleEntity(data)
  })
  test('when roles are found, should expect a role list', async () => {
    const output: RoleListOutput = { docs: roles, page: 1, limit: 1, total: 1, totalPages: 1 }
    repository.paginate = TestUtils.mockResolvedValue<RoleListOutput>(output)

    await expect(usecase.execute(input)).resolves.toEqual({
      docs: roles,
      page: 1,
      limit: 1,
      total: 1,
      totalPages: 1
    })
  })

  test('when roles not found, should expect an empty list', async () => {
    const output: RoleListOutput = { docs: [], page: 1, limit: 1, total: 1, totalPages: 1 }
    repository.paginate = TestUtils.mockResolvedValue<RoleListOutput>(output)

    await expect(usecase.execute(input)).resolves.toEqual(output)
  })
})
