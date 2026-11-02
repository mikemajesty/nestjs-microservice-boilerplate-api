/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/core/test.md
 */
import { ZodMockSchema } from '@mikemajesty/zod-mock-schema'
import { Test } from '@nestjs/testing'

import { PermissionEntity, PermissionEntitySchema } from '@/core/permission/entity/permission'
import { IPermissionRepository } from '@/core/permission/repository/permission'
import { ICacheAsideAdapter } from '@/infra/cache/aside/adapter'
import { CreatedModel } from '@/infra/repository'
import { IRoleAddPermission } from '@/modules/role/interfaces'
import { ApiNotFoundException } from '@/utils/exception'
import { TestUtils } from '@/utils/test/utils'
import { ZodExceptionIssue } from '@/utils/validator'

import { RoleEntity, RoleEntitySchema } from '../../entity/role'
import { IRoleRepository } from '../../repository/role'
import { RoleAddPermissionUsecase } from '../role-add-permission'
import { RoleAddPermissionInput, RoleAddPermissionSchema } from './../role-add-permission'

describe(RoleAddPermissionUsecase.name, () => {
  let usecase: IRoleAddPermission
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
          provide: IRoleAddPermission,
          useFactory: (
            roleRepository: IRoleRepository,
            permissionRepository: IPermissionRepository,
            cacheAsideAdapter: ICacheAsideAdapter
          ) => {
            return new RoleAddPermissionUsecase(roleRepository, permissionRepository, cacheAsideAdapter)
          },
          inject: [IRoleRepository, IPermissionRepository, ICacheAsideAdapter]
        }
      ]
    }).compile()

    usecase = app.get(IRoleAddPermission)
    repository = app.get(IRoleRepository)
    permissionRepository = app.get(IPermissionRepository)
  })

  test('when no input is specified, should expect an error', async () => {
    await TestUtils.expectZodError(
      () => usecase.execute({} as RoleAddPermissionInput),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([
          {
            message: 'Invalid input: expected string, received undefined',
            path: TestUtils.nameOf<RoleAddPermissionInput>('id')
          },
          {
            message: 'Invalid input: expected array, received undefined',
            path: TestUtils.nameOf<RoleAddPermissionInput>('permissions')
          }
        ])
      }
    )
  })

  const roleAddPermissionMock = new ZodMockSchema(RoleAddPermissionSchema)
  const input = roleAddPermissionMock.generate({
    overrides: { permissions: ['user:create', 'user:update'] }
  })

  test('when role not exists, should expect an error', async () => {
    repository.findOne = TestUtils.mockResolvedValue<RoleEntity>(null)

    await expect(usecase.execute(input)).rejects.toThrow(ApiNotFoundException)
  })

  const permissionMock = new ZodMockSchema(PermissionEntitySchema)
  const permissions = permissionMock.generateMany(10, {
    overrides: {
      name: permissionMock.faker.helpers.arrayElement(['user:create', 'user:update', 'user:delete', 'user:view'])
    },
    factory: (data) => new PermissionEntity(data)
  })

  const roleMock = new ZodMockSchema(RoleEntitySchema)
  const role = roleMock.generate({
    overrides: {
      permissions: roleMock.faker.helpers.arrayElements(permissions)
    },
    factory: (data) => new RoleEntity(data)
  })

  test('when adding permission with associated permission successfully, should expect an updated permission', async () => {
    repository.findOne = TestUtils.mockResolvedValue<RoleEntity>(role.clone())
    permissionRepository.findIn = TestUtils.mockResolvedValue<PermissionEntity[]>(permissions)
    repository.create = TestUtils.mockResolvedValue<CreatedModel>()

    await expect(usecase.execute(input)).resolves.toBeUndefined()
    expect(repository.create).toHaveBeenCalled()
  })

  test('when adding permission without associated permission successfully, should expect an updated permission', async () => {
    const permissionInDb = permissionMock.generate({
      overrides: { name: 'user:create' },
      factory: (data) => new PermissionEntity(data)
    })
    repository.findOne = TestUtils.mockResolvedValue<RoleEntity>(
      new RoleEntity({
        ...role,
        permissions: []
      })
    )
    permissionRepository.findIn = TestUtils.mockResolvedValue<PermissionEntity[]>([permissionInDb])
    repository.create = TestUtils.mockResolvedValue<CreatedModel>()

    await expect(usecase.execute({ ...input, permissions: ['user:create'] })).resolves.toBeUndefined()
    expect(repository.create).toHaveBeenCalled()
  })

  test('when permission does not exist in database, should create new permission', async () => {
    repository.findOne = TestUtils.mockResolvedValue<RoleEntity>(
      new RoleEntity({
        ...role,
        permissions: []
      })
    )
    permissionRepository.findIn = TestUtils.mockResolvedValue<PermissionEntity[]>([])
    repository.create = TestUtils.mockResolvedValue<CreatedModel>()

    await expect(usecase.execute({ ...input, permissions: ['new:permission'] })).resolves.toBeUndefined()
    expect(repository.create).toHaveBeenCalled()
  })

  test('when permission exists and is already associated with role, should skip it', async () => {
    const existingPermission = permissionMock.generate({
      overrides: { name: 'user:create' },
      factory: (data) => new PermissionEntity(data)
    })
    repository.findOne = TestUtils.mockResolvedValue<RoleEntity>(
      new RoleEntity({
        ...role,
        permissions: [existingPermission]
      })
    )
    permissionRepository.findIn = TestUtils.mockResolvedValue<PermissionEntity[]>([existingPermission])
    repository.create = TestUtils.mockResolvedValue<CreatedModel>()

    await expect(usecase.execute({ ...input, permissions: ['user:create'] })).resolves.toBeUndefined()
    expect(repository.create).toHaveBeenCalled()
  })
})
