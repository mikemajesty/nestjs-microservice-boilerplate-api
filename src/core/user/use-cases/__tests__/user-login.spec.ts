import { ZodMockSchema } from '@mikemajesty/zod-mock-schema'
import { Test } from '@nestjs/testing'

import { RoleEntity, RoleEntitySchema } from '@/core/role/entity/role'
import { ITokenAdapter, TokenLibModule } from '@/libs/token'
import { ILogin } from '@/modules/login/interfaces'
import { ApiBadRequestException, ApiNotFoundException } from '@/utils/exception'
import { MockUtils, TestUtils } from '@/utils/test'
import { ZodExceptionIssue } from '@/utils/validator'

import { UserEntity, UserEntitySchema } from '../../entity/user'
import { UserPasswordEntity, UserPasswordEntitySchema } from '../../entity/user-password'
import { IUserRepository } from '../../repository/user'
import { LoginInput, LoginOutput, LoginSchema, LoginUsecase } from '../user-login'

describe(LoginUsecase.name, () => {
  let usecase: ILogin
  let repository: IUserRepository

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      imports: [TokenLibModule],
      providers: [
        TestUtils.mockProvider(IUserRepository),
        {
          provide: ILogin,
          useFactory: (userRepository: IUserRepository, token: ITokenAdapter) => {
            return new LoginUsecase(userRepository, token)
          },
          inject: [IUserRepository, ITokenAdapter]
        }
      ]
    }).compile()

    usecase = app.get(ILogin)
    repository = app.get(IUserRepository)
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

  test('when user not found, should expect an error', async () => {
    repository.findOneWithRelation = TestUtils.mockResolvedValue<UserEntity>(null)

    await expect(usecase.execute(input, MockUtils.Tracing())).rejects.toThrow(ApiNotFoundException)
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

    await expect(usecase.execute(input, MockUtils.Tracing())).rejects.toThrow(ApiBadRequestException)
  })

  test('when user login successfully, should expect a token', async () => {
    user.password.password = '69bf0bc46f51b33377c4f3d92caf876714f6bbbe99e7544487327920873f9820'
    repository.findOneWithRelation = TestUtils.mockResolvedValue<UserEntity>(user.clone())

    await expect(usecase.execute(input, MockUtils.Tracing())).resolves.toEqual({
      accessToken: expect.any(String),
      refreshToken: expect.any(String)
    } as LoginOutput)
  })
})
