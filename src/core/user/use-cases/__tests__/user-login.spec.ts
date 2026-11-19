import { ZodMockSchema } from '@mikemajesty/zod-mock-schema'
import { Test } from '@nestjs/testing'

import { RoleEntity, RoleEntitySchema } from '@/core/role/entity/role'
import { ISessionAdapter } from '@/libs/session'
import { ILogin } from '@/modules/login/interfaces'
import { ApiUnauthorizedException } from '@/utils/exception'
import { ZodExceptionIssue } from '@/utils/schema'
import { MockUtils, TestUtils } from '@/utils/test'
import { PasswordFixture } from '@/utils/test/e2e'

import { UserEntity, UserEntitySchema } from '../../entity/user'
import { UserPasswordEntity, UserPasswordEntitySchema } from '../../entity/user-password'
import { IUserRepository } from '../../repository/user'
import { LoginInput, LoginOutput, LoginSchema, LoginUsecase } from '../user-login'

describe(LoginUsecase.name, () => {
  let usecase: ILogin
  let repository: IUserRepository
  let session: ISessionAdapter
  const tokens: LoginOutput = { accessToken: 'access', refreshToken: 'refresh' }

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      providers: [
        TestUtils.mockProvider(IUserRepository),
        TestUtils.mockProvider(ISessionAdapter, { start: TestUtils.mockResolvedValue<LoginOutput>(tokens) }),
        {
          provide: ILogin,
          useFactory: (userRepository: IUserRepository, session: ISessionAdapter) => {
            return new LoginUsecase(userRepository, session)
          },
          inject: [IUserRepository, ISessionAdapter]
        }
      ]
    }).compile()

    usecase = app.get(ILogin)
    repository = app.get(IUserRepository)
    session = app.get(ISessionAdapter)
  })

  test('when no input is specified, should expect an error', async () => {
    await TestUtils.expectZodError(
      () => usecase.execute({} as LoginInput, MockUtils.Tracing()),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([
          {
            message: 'Invalid input: expected string, received undefined',
            path: TestUtils.nameOf<LoginInput>('email')
          },
          {
            message: 'Invalid input: expected string, received undefined',
            path: TestUtils.nameOf<LoginInput>('password')
          }
        ])
      }
    )
  })

  const loginInputMock = new ZodMockSchema(LoginSchema)
  const input: LoginInput = loginInputMock.generate<LoginInput>({
    overrides: {
      email: 'admin@admin.com',
      password: '****'
    }
  })

  test('when user not found, should expect the same error as a wrong password', async () => {
    repository.findOneWithRelation = TestUtils.mockResolvedValue<UserEntity>(null)

    await expect(usecase.execute(input, MockUtils.Tracing())).rejects.toThrow(
      new ApiUnauthorizedException('invalidCredentials')
    )
    expect(session.start).not.toHaveBeenCalled()
  })

  const userPasswordMock = new ZodMockSchema(UserPasswordEntitySchema)
  const password = userPasswordMock.generate({
    overrides: {
      password: '****'
    },
    factory: (data) => new UserPasswordEntity(data)
  })

  const roleMock = new ZodMockSchema(RoleEntitySchema)
  const roles = roleMock.generateMany(2, {
    overrides: {
      permissions: []
    },
    factory: (data) => new RoleEntity(data)
  })

  const userMock = new ZodMockSchema(UserEntitySchema)
  const user = userMock.generate({
    overrides: {
      roles,
      password
    },
    factory: (data) => new UserEntity(data)
  })

  test('when password is incorrect, should expect an error', async () => {
    repository.findOneWithRelation = TestUtils.mockResolvedValue<UserEntity>(user.clone())

    await expect(usecase.execute(input, MockUtils.Tracing())).rejects.toThrow(
      new ApiUnauthorizedException('invalidCredentials')
    )
    expect(session.start).not.toHaveBeenCalled()
  })

  test('when user login successfully, should expect a token', async () => {
    user.password.password = PasswordFixture.MASKED.hash
    repository.findOneWithRelation = TestUtils.mockResolvedValue<UserEntity>(user.clone())

    await expect(usecase.execute(input, MockUtils.Tracing())).resolves.toEqual(tokens)
    expect(session.start).toHaveBeenCalledWith(expect.objectContaining({ id: user.id }))
  })
})
