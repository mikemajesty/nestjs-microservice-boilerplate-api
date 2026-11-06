/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/core/test.md
 */
import { ZodMockSchema } from '@mikemajesty/zod-mock-schema'
import { Test } from '@nestjs/testing'

import {
  PermissionListOutput,
  PermissionListSchema,
  PermissionListUsecase
} from '@/core/permission/use-cases/permission-list'
import { IPermissionList } from '@/modules/permission/interfaces'
import { TestUtils } from '@/utils/test/utils'

import { IPermissionRepository } from '../../repository/permission'
import { PermissionEntity, PermissionEntitySchema } from './../../entity/permission'

describe(PermissionListUsecase.name, () => {
  let usecase: IPermissionList
  let repository: IPermissionRepository

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      providers: [
        TestUtils.mockProvider(IPermissionRepository),
        {
          provide: IPermissionList,
          useFactory: (permissionRepository: IPermissionRepository) => {
            return new PermissionListUsecase(permissionRepository)
          },
          inject: [IPermissionRepository]
        }
      ]
    }).compile()

    usecase = app.get(IPermissionList)
    repository = app.get(IPermissionRepository)
  })

  const input = new ZodMockSchema(PermissionListSchema).generate()

  const permissionEntityMock = new ZodMockSchema(PermissionEntitySchema)
  const permissions = permissionEntityMock.generateMany(5, {
    overrides: {
      name: 'name:permission',
      roles: []
    },
    factory: (data) => new PermissionEntity(data)
  })

  test('when permissions are found, should expect a permission list', async () => {
    const output: PermissionListOutput = { docs: permissions, page: 1, limit: 1, total: 1, totalPages: 1 }
    repository.paginate = TestUtils.mockResolvedValue<PermissionListOutput>(output)

    await expect(usecase.execute(input)).resolves.toEqual({
      docs: permissions,
      page: 1,
      limit: 1,
      total: 1,
      totalPages: 1
    })
  })

  test('when permissions not found, should expect an empty list', async () => {
    const output: PermissionListOutput = { docs: [], page: 1, limit: 1, total: 1, totalPages: 1 }
    repository.paginate = TestUtils.mockResolvedValue<PermissionListOutput>(output)

    await expect(usecase.execute(input)).resolves.toEqual(output)
  })
})
