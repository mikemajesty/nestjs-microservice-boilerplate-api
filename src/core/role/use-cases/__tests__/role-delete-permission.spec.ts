/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/core/test.md
 */
import { ZodMockSchema } from '@mikemajesty/zod-mock-schema'
import { Test } from '@nestjs/testing'

import { PermissionEntity, PermissionEntitySchema } from '@/core/permission/entity/permission'
import { IPermissionRepository } from '@/core/permission/repository/permission'
import { ICacheAsideAdapter } from '@/infra/cache/aside'
import { CreatedModel } from '@/infra/repository'
import { IRoleDeletePermission } from '@/modules/role/interfaces'
import { ApiNotFoundException } from '@/utils/exception'
import { IDGeneratorUtils } from '@/utils/id-generator'
import { TestUtils } from '@/utils/test/utils'
import { ZodExceptionIssue } from '@/utils/validator'

import { RoleEntity, RoleEnum } from '../../entity/role'
import { IRoleRepository } from '../../repository/role'
import {
  RoleDeletePermissionInput,
  RoleDeletePermissionSchema,
  RoleDeletePermissionUsecase
} from '../role-delete-permission'

describe(RoleDeletePermissionUsecase.name, () => {
  let usecase: IRoleDeletePermission
  let repository: IRoleRepository
  let permissionRepository: IPermissionRepository

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      providers: [
        TestUtils.mockProvider(IRoleRepository),
        TestUtils.mockProvider(IPermissionRepository),
        TestUtils.mockProvider(ICacheAsideAdapter, {
          invalidate: TestUtils.mockResolvedValue()
        }),
        {
          provide: IRoleDeletePermission,
          useFactory: (
            roleRepository: IRoleRepository,
            permissionRepository: IPermissionRepository,
            cacheAside: ICacheAsideAdapter
          ) => {
            return new RoleDeletePermissionUsecase(roleRepository, permissionRepository, cacheAside)
          },
          inject: [IRoleRepository, IPermissionRepository, ICacheAsideAdapter]
        }
      ]
    }).compile()

    usecase = app.get(IRoleDeletePermission)
    repository = app.get(IRoleRepository)
    permissionRepository = app.get(IPermissionRepository)
  })

  test('when no input is specified, should expect an error', async () => {
    await TestUtils.expectZodError(
      () => usecase.execute({} as RoleDeletePermissionInput),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([
          {
            message: 'Invalid input: expected string, received undefined',
            path: TestUtils.nameOf<RoleDeletePermissionInput>('id')
          },
          {
            message: 'Invalid input: expected array, received undefined',
            path: TestUtils.nameOf<RoleDeletePermissionInput>('permissions')
          }
        ])
      }
    )
  })

  const permissionDeleteInputMock = new ZodMockSchema(RoleDeletePermissionSchema)
  const input = permissionDeleteInputMock.generate({
    overrides: {
      permissions: ['user:create', 'user:update']
    }
  })

  test('when role not exists, should expect an error', async () => {
    repository.findOne = TestUtils.mockResolvedValue<RoleEntity>(null)

    await expect(usecase.execute(input)).rejects.toThrow(ApiNotFoundException)
  })

  const permissiontMock = new ZodMockSchema(PermissionEntitySchema)
  const permissions = permissiontMock.generateMany<PermissionEntity>(10, {
    overrides: {
      name: 'user:create'
    }
  })

  const role = new RoleEntity({ id: IDGeneratorUtils.uuid(), name: RoleEnum.USER, permissions })

  test('when some permission does not exist, should expect an error', async () => {
    repository.findOne = TestUtils.mockResolvedValue<RoleEntity>(role)
    permissionRepository.findIn = TestUtils.mockResolvedValue<PermissionEntity[]>(permissions)
    repository.create = TestUtils.mockResolvedValue<CreatedModel>(null)

    await expect(
      usecase.execute({ ...input, permissions: input.permissions.concat('user:getbyid') })
    ).resolves.toBeUndefined()
    expect(repository.create).toHaveBeenCalled()
  })

  test('when permission exists but is not associated with role, should not remove it', async () => {
    const otherPermission = permissiontMock.generate<PermissionEntity>({
      overrides: { name: 'other:permission' }
    })
    const permissionInDb = permissiontMock.generate<PermissionEntity>({
      overrides: { name: 'user:create' }
    })

    repository.findOne = TestUtils.mockResolvedValue<RoleEntity>({
      ...role,
      permissions: [otherPermission]
    })
    permissionRepository.findIn = TestUtils.mockResolvedValue<PermissionEntity[]>([permissionInDb])
    repository.create = TestUtils.mockResolvedValue<CreatedModel>(null)

    await expect(usecase.execute({ ...input, permissions: ['user:create'] })).resolves.toBeUndefined()
    expect(repository.create).toHaveBeenCalled()
  })
})
