/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/core/test.md
 */
import { ZodMockSchema } from '@mikemajesty/zod-mock-schema'
import { Test } from '@nestjs/testing'

import { RoleEntity, RoleEntitySchema } from '@/core/role/entity/role'
import { ISessionAdapter, SessionRotateInput } from '@/libs/session'
import { IRefreshToken } from '@/modules/login/interfaces'
import { ApiNotFoundException, ApiUnauthorizedException } from '@/utils/exception'
import { ZodExceptionIssue } from '@/utils/schema'
import { MockUtils, TestUtils } from '@/utils/test'
import { PasswordFixture } from '@/utils/test/e2e'

import { UserEntity, UserEntitySchema } from '../../entity/user'
import { UserPasswordEntity, UserPasswordEntitySchema } from '../../entity/user-password'
import { IUserRepository } from '../../repository/user'
import { RefreshTokenInput, RefreshTokenOutput, RefreshTokenUsecase } from '../user-refresh-token'

describe(RefreshTokenUsecase.name, () => {
  let usecase: IRefreshToken
  let repository: IUserRepository
  let session: ISessionAdapter
  const tokens: RefreshTokenOutput = { accessToken: 'access', refreshToken: 'refresh' }
  const userId = MockUtils.UUID()

  const rotateSuccessfully = jest.fn(async ({ loadUser }: SessionRotateInput) => {
    await loadUser(userId)
    return tokens
  })

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      providers: [
        TestUtils.mockProvider(IUserRepository),
        TestUtils.mockProvider(ISessionAdapter),
        {
          provide: IRefreshToken,
          useFactory: (repository: IUserRepository, session: ISessionAdapter) => {
            return new RefreshTokenUsecase(repository, session)
          },
          inject: [IUserRepository, ISessionAdapter]
        }
      ]
    }).compile()

    usecase = app.get(IRefreshToken)
    repository = app.get(IUserRepository)
    session = app.get(ISessionAdapter)
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

  test('when refresh token is invalid, revoked or reused, should expect an error', async () => {
    session.rotate = TestUtils.mockRejectedValue(new ApiUnauthorizedException('invalidRefreshToken'))

    await expect(usecase.execute(input)).rejects.toThrow(ApiUnauthorizedException)
  })

  test('when user not found, should expect an error', async () => {
    session.rotate = rotateSuccessfully
    repository.findOneWithRelation = TestUtils.mockResolvedValue<UserEntity>(null)

    await expect(usecase.execute(input)).rejects.toThrow(new ApiNotFoundException('userNotFound'))
  })

  const passwordMock = new ZodMockSchema(UserPasswordEntitySchema)
  const password = passwordMock.generate({
    overrides: { password: PasswordFixture.MASKED.hash },
    factory: (data) => new UserPasswordEntity(data)
  })
  const roleMock = new ZodMockSchema(RoleEntitySchema)
  const userMock = new ZodMockSchema(UserEntitySchema)
  const user = userMock.generate({
    overrides: {
      id: userId,
      password,
      roles: roleMock.generateMany(2, {
        overrides: { permissions: [] },
        factory: (data) => new RoleEntity(data)
      })
    },
    factory: (data) => new UserEntity(data)
  })

  test('when user role not found, should expect an error', async () => {
    session.rotate = rotateSuccessfully
    repository.findOneWithRelation = TestUtils.mockResolvedValue<UserEntity>({ ...user, roles: [] })

    await expect(usecase.execute(input)).rejects.toThrow(new ApiNotFoundException('roleNotFound'))
  })

  test('when user refresh token successfully, should expect a token', async () => {
    session.rotate = rotateSuccessfully
    repository.findOneWithRelation = TestUtils.mockResolvedValue<UserEntity>(user.clone())

    await expect(usecase.execute(input)).resolves.toEqual(tokens)
    expect(session.rotate).toHaveBeenCalledWith({ refreshToken: input.refreshToken, loadUser: expect.any(Function) })
    expect(repository.findOneWithRelation).toHaveBeenCalledWith({ id: userId }, { roles: true })
  })
})
