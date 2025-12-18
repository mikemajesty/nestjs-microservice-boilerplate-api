/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/main/guides/core/test.md
 */
import { ZodMockSchema } from '@mikemajesty/zod-mock-schema'
import { Test } from '@nestjs/testing'

import { RoleEntity, RoleEntitySchema } from '@/core/role/entity/role'
import { ITokenAdapter, SignOutput } from '@/libs/token'
import { IRefreshTokenAdapter } from '@/modules/login/adapter'
import { ApiBadRequestException, ApiNotFoundException } from '@/utils/exception'
import { TestUtils } from '@/utils/test/util'
import { ZodExceptionIssue } from '@/utils/validator'

import { UserEntity, UserEntitySchema } from '../../entity/user'
import { UserPasswordEntitySchema } from '../../entity/user-password'
import { IUserRepository } from '../../repository/user'
import {
  RefreshTokenInput,
  RefreshTokenOutput,
  RefreshTokenUsecase,
  UserRefreshTokenVerifyInput
} from '../user-refresh-token'

describe(RefreshTokenUsecase.name, () => {
  let usecase: IRefreshTokenAdapter
  let repository: IUserRepository
  let token: ITokenAdapter

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      imports: [],
      providers: [
        {
          provide: IUserRepository,
          useValue: {}
        },
        {
          provide: ITokenAdapter,
          useValue: {
            verify: TestUtils.mockResolvedValue<UserRefreshTokenVerifyInput>()
          }
        },
        {
          provide: IRefreshTokenAdapter,
          useFactory: (repository: IUserRepository, token: ITokenAdapter) => {
            return new RefreshTokenUsecase(repository, token)
          },
          inject: [IUserRepository, ITokenAdapter]
        }
      ]
    }).compile()

    usecase = app.get(IRefreshTokenAdapter)
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
        userId: TestUtils.getMockUUID()
      }
    })
    repository.findOne = TestUtils.mockResolvedValue<UserEntity>(null)

    await expect(usecase.execute(input)).rejects.toThrow(ApiNotFoundException)
  })

  const passwordMock = new ZodMockSchema(UserPasswordEntitySchema)
  const password = passwordMock.generate({
    overrides: {
      password: '***'
    }
  })
  const roleMock = new ZodMockSchema(RoleEntitySchema)

  const userMock = new ZodMockSchema(UserEntitySchema)

  test('when user role not found, should expect an error', async () => {
    const user = userMock.generate<UserEntity>({
      overrides: {
        password,
        roles: roleMock.generateMany<RoleEntity>(2, {
          overrides: {
            permissions: []
          }
        })
      }
    })
    token.verify = TestUtils.mockImplementation<UserRefreshTokenVerifyInput>(() => {
      return {
        userId: TestUtils.getMockUUID()
      }
    })
    repository.findOne = TestUtils.mockResolvedValue<UserEntity>({ ...user, roles: [] })

    await expect(usecase.execute(input)).rejects.toThrow(ApiNotFoundException)
  })

  test('when user refresh token successfully, should expect a token', async () => {
    token.verify = TestUtils.mockImplementation<UserRefreshTokenVerifyInput>(() => ({
      userId: TestUtils.getMockUUID()
    }))
    token.sign = TestUtils.mockReturnValue<SignOutput>({ token: '<token>' })
    const user = userMock.generate<UserEntity>({
      overrides: {
        password: { ...password, password: '69bf0bc46f51b33377c4f3d92caf876714f6bbbe99e7544487327920873f9820' },
        roles: roleMock.generateMany<RoleEntity>(2, {
          overrides: {
            permissions: []
          }
        })
      }
    })
    repository.findOne = TestUtils.mockResolvedValue<UserEntity>(user)

    await expect(usecase.execute(input)).resolves.toEqual({
      accessToken: expect.any(String),
      refreshToken: expect.any(String)
    } as RefreshTokenOutput)
  })
})
