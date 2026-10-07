/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/core/test.md
 */
import { ZodMockSchema } from '@mikemajesty/zod-mock-schema'
import { Test } from '@nestjs/testing'

import { RoleEntity, RoleEntitySchema } from '@/core/role/entity/role'
import { ITokenAdapter, TokenSignOutput } from '@/libs/token'
import { IRefreshToken } from '@/modules/login/interfaces'
import { ApiBadRequestException, ApiNotFoundException } from '@/utils/exception'
import { MockUtils, TestUtils } from '@/utils/test'
import { ZodExceptionIssue } from '@/utils/validator'

import { UserEntity, UserEntitySchema } from '../../entity/user'
import { UserPasswordEntity, UserPasswordEntitySchema } from '../../entity/user-password'
import { IUserRepository } from '../../repository/user'
import {
  RefreshTokenInput,
  RefreshTokenOutput,
  RefreshTokenUsecase,
  UserRefreshTokenVerifyInput
} from '../user-refresh-token'

describe(RefreshTokenUsecase.name, () => {
  let usecase: IRefreshToken
  let repository: IUserRepository
  let token: ITokenAdapter

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      imports: [],
      providers: [
        TestUtils.mockProvider(IUserRepository),
        TestUtils.mockProvider(ITokenAdapter, {
          verify: TestUtils.mockResolvedValue<UserRefreshTokenVerifyInput>() as ITokenAdapter[`verify`]
        }),
        {
          provide: IRefreshToken,
          useFactory: (repository: IUserRepository, token: ITokenAdapter) => {
            return new RefreshTokenUsecase(repository, token)
          },
          inject: [IUserRepository, ITokenAdapter]
        }
      ]
    }).compile()

    usecase = app.get(IRefreshToken)
    repository = app.get(IUserRepository)
    token = app.get(ITokenAdapter)
  })

  test('when no input is specified, should expect an error', async () => {
    await TestUtils.expectZodError(
      () => usecase.execute({} as RefreshTokenInput),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([
          {
            message: 'Invalid input: expected string, received undefined',
            path: TestUtils.nameOf<RefreshTokenInput>('refreshToken')
          }
        ])
      }
    )
  })

  const input: RefreshTokenInput = { refreshToken: '<token>' }
  test('when token is incorrect, should expect an error', async () => {
    token.verify = TestUtils.mockImplementation<UserRefreshTokenVerifyInput>(() => ({
      userId: null
    }))
    repository.findOne = TestUtils.mockResolvedValue<UserEntity>(null)

    await expect(usecase.execute(input)).rejects.toThrow(ApiBadRequestException)
  })

  test('when user not found, should expect an error', async () => {
    token.verify = TestUtils.mockImplementation<UserRefreshTokenVerifyInput>(() => {
      return {
        userId: MockUtils.UUID()
      }
    })
    repository.findOne = TestUtils.mockResolvedValue<UserEntity>(null)

    await expect(usecase.execute(input)).rejects.toThrow(ApiNotFoundException)
  })

  const passwordMock = new ZodMockSchema(UserPasswordEntitySchema)
  const password = passwordMock.generate({
    overrides: {
      password: '***'
    },
    factory: (data) => new UserPasswordEntity(data)
  })
  const roleMock = new ZodMockSchema(RoleEntitySchema)

  const userMock = new ZodMockSchema(UserEntitySchema)

  test('when user role not found, should expect an error', async () => {
    const user = userMock.generate({
      overrides: {
        password,
        roles: roleMock.generateMany(2, {
          overrides: {
            permissions: []
          },
          factory: (data) => new RoleEntity(data)
        })
      },
      factory: (data) => new UserEntity(data)
    })
    token.verify = TestUtils.mockImplementation<UserRefreshTokenVerifyInput>(() => {
      return {
        userId: MockUtils.UUID()
      }
    })
    repository.findOne = TestUtils.mockResolvedValue<UserEntity>({ ...user, roles: [] })

    await expect(usecase.execute(input)).rejects.toThrow(ApiNotFoundException)
  })

  test('when user refresh token successfully, should expect a token', async () => {
    token.verify = TestUtils.mockImplementation<UserRefreshTokenVerifyInput>(() => ({
      userId: MockUtils.UUID()
    }))
    token.sign = TestUtils.mockReturnValue<TokenSignOutput>({ token: '<token>' })
    const user = userMock.generate({
      overrides: {
        password: { ...password, password: '69bf0bc46f51b33377c4f3d92caf876714f6bbbe99e7544487327920873f9820' },
        roles: roleMock.generateMany(2, {
          overrides: {
            permissions: []
          },
          factory: (data) => new RoleEntity(data)
        })
      },
      factory: (data) => new UserEntity(data)
    })
    repository.findOne = TestUtils.mockResolvedValue<UserEntity>(user.clone())

    await expect(usecase.execute(input)).resolves.toEqual({
      accessToken: expect.any(String),
      refreshToken: expect.any(String)
    } as RefreshTokenOutput)
  })
})
