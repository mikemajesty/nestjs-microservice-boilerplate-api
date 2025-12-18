/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/main/guides/core/test.md
 */
import { ZodMockSchema } from '@mikemajesty/zod-mock-schema'
import { Test } from '@nestjs/testing'

import { RoleEntity, RoleEntitySchema } from '@/core/role/entity/role'
import { IRoleRepository } from '@/core/role/repository/role'
import { ILoggerAdapter, LoggerModule } from '@/infra/logger'
import { CreatedModel } from '@/infra/repository'
import { EmitEventOutput, IEventAdapter } from '@/libs/event'
import { IUserCreateAdapter } from '@/modules/user/adapter'
import { ApiConflictException, ApiNotFoundException } from '@/utils/exception'
import { TestUtils } from '@/utils/test/util'
import { ZodExceptionIssue } from '@/utils/validator'

import { UserEntity, UserEntitySchema } from '../../entity/user'
import { UserPasswordEntitySchema } from '../../entity/user-password'
import { IUserRepository } from '../../repository/user'
import { UserCreateInput, UserCreateSchema, UserCreateUsecase } from '../user-create'

describe(UserCreateUsecase.name, () => {
  let usecase: IUserCreateAdapter
  let repository: IUserRepository
  let roleRepository: IRoleRepository

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [
        {
          provide: IUserRepository,
          useValue: {}
        },
        {
          provide: IRoleRepository,
          useValue: {}
        },
        {
          provide: IEventAdapter,
          useValue: {
            emit: TestUtils.mockResolvedValue<EmitEventOutput>()
          }
        },
        {
          provide: IUserCreateAdapter,
          useFactory: (
            userRepository: IUserRepository,
            logger: ILoggerAdapter,
            event: IEventAdapter,
            roleRepository: IRoleRepository
          ) => {
            return new UserCreateUsecase(userRepository, logger, event, roleRepository)
          },
          inject: [IUserRepository, ILoggerAdapter, IEventAdapter, IRoleRepository]
        }
      ]
    }).compile()

    usecase = app.get(IUserCreateAdapter)
    repository = app.get(IUserRepository)
    roleRepository = app.get(IRoleRepository)
  })

  test('when no input is specified, should expect an error', async () => {
    await TestUtils.expectZodError(
      () => usecase.execute({} as UserCreateInput, TestUtils.getMockTracing()),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([
          {
            message: 'Invalid input: expected string, received undefined',
            path: TestUtils.nameOf<UserCreateInput>('email')
          },
          {
            message: 'Invalid input: expected string, received undefined',
            path: TestUtils.nameOf<UserCreateInput>('name')
          },
          {
            message: 'Invalid input: expected string, received undefined',
            path: TestUtils.nameOf<UserCreateInput>('password')
          },
          {
            message: 'Invalid input: expected array, received undefined',
            path: TestUtils.nameOf<UserCreateInput>('roles')
          }
        ])
      }
    )
  })

  const userCreateMock = new ZodMockSchema(UserCreateSchema)
  const input = userCreateMock.generate()

  test('when role not found, should expect an error', async () => {
    roleRepository.findIn = TestUtils.mockResolvedValue<RoleEntity[]>([])

    await expect(usecase.execute(input, TestUtils.getMockTracing())).rejects.toThrow(ApiNotFoundException)
  })

  const roleMock = new ZodMockSchema(RoleEntitySchema)
  const roles = roleMock.generateMany<RoleEntity>(2, {
    overrides: {
      permissions: []
    }
  })

  const userPasswordMock = new ZodMockSchema(UserPasswordEntitySchema)
  const password = userPasswordMock.generate({
    overrides: {
      password: `8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918`
    }
  })

  const userMock = new ZodMockSchema(UserEntitySchema)
  const user = userMock.generate<UserEntity>({
    overrides: {
      roles,
      password
    }
  })

  test('when user already exists, should expect an error', async () => {
    roleRepository.findIn = TestUtils.mockResolvedValue<RoleEntity[]>(roles)
    repository.findOne = TestUtils.mockResolvedValue<UserEntity>(user)

    await expect(usecase.execute(input, TestUtils.getMockTracing())).rejects.toThrow(ApiConflictException)
  })

  test('when user created successfully, should expect a user', async () => {
    roleRepository.findIn = TestUtils.mockResolvedValue<RoleEntity[]>(roles)
    repository.findOne = TestUtils.mockResolvedValue<UserEntity>(null)
    const createOutput = { created: true, id: TestUtils.getMockUUID() }
    repository.create = TestUtils.mockResolvedValue<CreatedModel>(createOutput)

    await expect(usecase.execute(input, TestUtils.getMockTracing())).resolves.toEqual(createOutput)
  })
})
