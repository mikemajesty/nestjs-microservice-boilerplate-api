/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/core/test.md
 */
import { ZodMockSchema } from '@mikemajesty/zod-mock-schema'
import { Test } from '@nestjs/testing'

import { RoleEntity, RoleEntitySchema, RoleEnum } from '@/core/role/entity/role'
import { IRoleRepository } from '@/core/role/repository/role'
import { ICacheAsideAdapter } from '@/infra/cache/aside'
import { ILoggerAdapter, LoggerModule } from '@/infra/logger'
import { CreatedModel } from '@/infra/repository'
import { IUserUpdate } from '@/modules/user/interfaces'
import { ApiConflictException, ApiNotFoundException } from '@/utils/exception'
import { IDGeneratorUtils } from '@/utils/id-generator'
import { MockUtils, TestUtils } from '@/utils/test'
import { ZodExceptionIssue } from '@/utils/validator'

import { UserEntity, UserEntitySchema } from '../../entity/user'
import { IUserRepository } from '../../repository/user'
import { UserUpdateInput, UserUpdateSchema, UserUpdateUsecase } from '../user-update'

describe(UserUpdateUsecase.name, () => {
  let usecase: IUserUpdate
  let repository: IUserRepository
  let roleRepository: IRoleRepository

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [
        TestUtils.mockProvider(IUserRepository),
        TestUtils.mockProvider(IRoleRepository),
        TestUtils.mockProvider(ICacheAsideAdapter, {
          invalidate: TestUtils.mockResolvedValue()
        }),
        {
          provide: IUserUpdate,
          useFactory: (
            userRepository: IUserRepository,
            logger: ILoggerAdapter,
            roleRepository: IRoleRepository,
            cacheAsise: ICacheAsideAdapter
          ) => {
            return new UserUpdateUsecase(userRepository, logger, roleRepository, cacheAsise)
          },
          inject: [IUserRepository, ILoggerAdapter, IRoleRepository, ICacheAsideAdapter]
        }
      ]
    }).compile()

    usecase = app.get(IUserUpdate)
    repository = app.get(IUserRepository)
    roleRepository = app.get(IRoleRepository)
  })

  test('when no input is specified, should expect an error', async () => {
    await TestUtils.expectZodError(
      () => usecase.execute({} as UserUpdateInput, MockUtils.Tracing()),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([
          {
            message: 'Invalid input: expected string, received undefined',
            path: TestUtils.nameOf<UserUpdateInput>('id')
          }
        ])
      }
    )
  })

  const roleMock = new ZodMockSchema(RoleEntitySchema)
  const roles = roleMock.generateMany<RoleEntity>(3, {
    overrides: {
      permissions: []
    }
  })
  const userMock = new ZodMockSchema(UserEntitySchema)
  const user = userMock.generate<UserEntity>({
    overrides: {
      roles
    }
  })

  const userUpdateMock = new ZodMockSchema(UserUpdateSchema)
  const input = userUpdateMock.generate({
    overrides: {
      roles: [RoleEnum.USER] as RoleEnum[]
    }
  })
  test('when user not found, should expect an error', async () => {
    repository.findOneWithRelation = TestUtils.mockResolvedValue<UserEntity>(null)

    await expect(usecase.execute(input, MockUtils.Tracing())).rejects.toThrow(ApiNotFoundException)
  })

  const role = new RoleEntity({ id: IDGeneratorUtils.uuid(), name: RoleEnum.USER })

  test('when user already exists, should expect an error', async () => {
    repository.findOneWithRelation = TestUtils.mockResolvedValue<UserEntity>(user)
    repository.existsOnUpdate = TestUtils.mockResolvedValue<boolean>(true)
    roleRepository.findIn = TestUtils.mockResolvedValue<RoleEntity[]>([role])

    await expect(usecase.execute(input, MockUtils.Tracing())).rejects.toThrow(ApiConflictException)
  })

  test('when role not found, should expect an error', async () => {
    repository.findOneWithRelation = TestUtils.mockResolvedValue<UserEntity>(user)
    roleRepository.findIn = TestUtils.mockResolvedValue<RoleEntity[]>([])

    await expect(usecase.execute(input, MockUtils.Tracing())).rejects.toThrow(ApiNotFoundException)
  })

  test('when user updated successfully, should expect a user updated', async () => {
    repository.findOneWithRelation = TestUtils.mockResolvedValue<UserEntity>(user)
    repository.existsOnUpdate = TestUtils.mockResolvedValue<boolean>(false)
    roleRepository.findIn = TestUtils.mockResolvedValue<RoleEntity[]>([role])
    repository.create = TestUtils.mockResolvedValue<CreatedModel>()
    repository.findOne = TestUtils.mockResolvedValue<UserEntity>(user)

    await expect(usecase.execute(input, MockUtils.Tracing())).resolves.toEqual(user)
  })

  test('when user role not provided, should use user role, then should expect a user updated', async () => {
    repository.findOneWithRelation = TestUtils.mockResolvedValue<UserEntity>(user)
    repository.existsOnUpdate = TestUtils.mockResolvedValue<boolean>(false)
    roleRepository.findIn = TestUtils.mockResolvedValue<RoleEntity[]>([role])
    repository.create = TestUtils.mockResolvedValue<CreatedModel>()
    repository.findOne = TestUtils.mockResolvedValue<UserEntity>(user)

    await expect(usecase.execute({ id: user.id }, MockUtils.Tracing())).resolves.toEqual(user)
  })
})
