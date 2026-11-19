/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/core/test.md
 */
import { ZodMockSchema } from '@mikemajesty/zod-mock-schema'
import { Test } from '@nestjs/testing'

import { RoleEntity, RoleEntitySchema } from '@/core/role/entity/role'
import { UserEntity, UserEntitySchema } from '@/core/user/entity/user'
import { UserPasswordEntity } from '@/core/user/entity/user-password'
import { IUserRepository } from '@/core/user/repository/user'
import { CreatedModel, RemovedModel } from '@/infra/repository'
import { EmitEventOutput, IEventAdapter } from '@/libs/event'
import { ISessionAdapter } from '@/libs/session'
import { ITokenAdapter } from '@/libs/token'
import { IConfirmResetPassword } from '@/modules/reset-password/interfaces'
import { ApiBadRequestException, ApiNotFoundException, ApiUnauthorizedException } from '@/utils/exception'
import { PasswordUtils } from '@/utils/password'
import { UserRequest } from '@/utils/request'
import { ZodExceptionIssue } from '@/utils/schema'
import { MockUtils, TestUtils } from '@/utils/test'
import { PasswordFixture } from '@/utils/test/e2e'

import { ResetPasswordEntity } from '../../entity/reset-password'
import { IResetPasswordRepository } from '../../repository/reset-password'
import {
  ResetPasswordConfirmInput,
  ResetPasswordConfirmUsecase,
  ResetPasswordConfirmVerify
} from '../reset-password-confirm'
import { RESET_PASSWORD_TOKEN_PURPOSE } from '../reset-password-send-email'

describe(ResetPasswordConfirmUsecase.name, () => {
  let usecase: IConfirmResetPassword
  let repository: IResetPasswordRepository
  let userRepository: IUserRepository
  let session: ISessionAdapter
  let token: ITokenAdapter

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      imports: [],
      providers: [
        TestUtils.mockProvider(IUserRepository),
        TestUtils.mockProvider(IResetPasswordRepository),
        TestUtils.mockProvider(ITokenAdapter, {
          verify: TestUtils.mockResolvedValue<ResetPasswordConfirmVerify>({
            id: MockUtils.UUID(),
            purpose: RESET_PASSWORD_TOKEN_PURPOSE
          }) as ITokenAdapter['verify']
        }),
        TestUtils.mockProvider(IEventAdapter, {
          emit: TestUtils.mockReturnValue<EmitEventOutput>()
        }),
        TestUtils.mockProvider(ISessionAdapter, { revokeAll: TestUtils.mockResolvedValue() }),
        {
          provide: IConfirmResetPassword,
          useFactory: (
            repository: IResetPasswordRepository,
            userRepository: IUserRepository,
            token: ITokenAdapter,
            event: IEventAdapter,
            session: ISessionAdapter
          ) => {
            return new ResetPasswordConfirmUsecase(repository, userRepository, token, event, session)
          },
          inject: [IResetPasswordRepository, IUserRepository, ITokenAdapter, IEventAdapter, ISessionAdapter]
        }
      ]
    }).compile()

    usecase = app.get(IConfirmResetPassword)
    repository = app.get(IResetPasswordRepository)
    userRepository = app.get(IUserRepository)
    session = app.get(ISessionAdapter)
    token = app.get(ITokenAdapter)
  })

  test('when no input is specified, should expect an error', async () => {
    await TestUtils.expectZodError(
      () => usecase.execute({} as ResetPasswordConfirmInput),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([
          {
            message: 'Invalid input: expected string, received undefined',
            path: TestUtils.nameOf<ResetPasswordConfirmInput>('token')
          },
          {
            message: 'Invalid input: expected string, received undefined',
            path: TestUtils.nameOf<ResetPasswordConfirmInput>('password')
          },
          {
            message: 'Invalid input: expected string, received undefined',
            path: TestUtils.nameOf<ResetPasswordConfirmInput>('confirmPassword')
          }
        ])
      }
    )
  })

  test('when passwords are different, should expect an error', async () => {
    await expect(usecase.execute({ confirmPassword: '123456', password: '1234567', token: '111' })).rejects.toThrow(
      ApiBadRequestException
    )
  })

  const input: ResetPasswordConfirmInput = { confirmPassword: '123456', password: '123456', token: 'token' }

  const resetPasswordMock = new ZodMockSchema(UserEntitySchema)
  const roleMock = new ZodMockSchema(RoleEntitySchema)
  const user = resetPasswordMock.generate({
    overrides: {
      roles: [
        roleMock.generate({
          overrides: {
            permissions: []
          },
          factory: (data) => new RoleEntity(data)
        })
      ]
    },
    factory: (data) => new UserEntity(data)
  })

  test('when user not found, should expect an error', async () => {
    userRepository.findOneWithRelation = TestUtils.mockResolvedValue<UserEntity>(null)

    await expect(usecase.execute(input)).rejects.toThrow(ApiNotFoundException)
  })

  test('when token was expired, should expect an error', async () => {
    userRepository.findOneWithRelation = TestUtils.mockResolvedValue<UserEntity>(user.clone())
    repository.findByIdUserId = TestUtils.mockResolvedValue<ResetPasswordEntity>(null)

    await expect(usecase.execute(input)).rejects.toThrow(ApiUnauthorizedException)
  })

  const defaultResetPassword = new ResetPasswordEntity({ id: MockUtils.UUID(), token: 'token', user })

  test('when token is not a reset-password token (e.g. an access token), should expect an error', async () => {
    token.verify = TestUtils.mockResolvedValue<UserRequest>({
      id: user.id,
      sid: MockUtils.UUID()
    }) as ITokenAdapter['verify']

    await expect(usecase.execute(input)).rejects.toThrow(new ApiUnauthorizedException('invalidToken'))
  })

  test('when token is not the one pending for the user, should expect an error', async () => {
    userRepository.findOneWithRelation = TestUtils.mockResolvedValue<UserEntity>(user.clone())
    repository.findByIdUserId = TestUtils.mockResolvedValue<ResetPasswordEntity>(
      new ResetPasswordEntity({ id: MockUtils.UUID(), token: 'a-newer-token', user })
    )

    await expect(usecase.execute(input)).rejects.toThrow(new ApiUnauthorizedException('token was expired'))
  })
  test('when confirm successfully, should expect a void', async () => {
    userRepository.findOneWithRelation = TestUtils.mockResolvedValue<UserEntity>(user.clone())
    userRepository.create = TestUtils.mockResolvedValue<CreatedModel>()
    repository.findByIdUserId = TestUtils.mockResolvedValue<ResetPasswordEntity>(defaultResetPassword.clone())
    repository.remove = TestUtils.mockResolvedValue<RemovedModel>()

    await expect(usecase.execute(input)).resolves.toBeUndefined()
    expect(userRepository.create).toHaveBeenCalled()
  })

  test('when confirm successfully, should save the new password hashed', async () => {
    const storedUser = user.clone()
    storedUser.password = new UserPasswordEntity({
      id: MockUtils.UUID(),
      password: PasswordFixture.MASKED.hash
    })
    userRepository.findOneWithRelation = TestUtils.mockResolvedValue<UserEntity>(storedUser)
    userRepository.create = TestUtils.mockResolvedValue<CreatedModel>()
    repository.findByIdUserId = TestUtils.mockResolvedValue<ResetPasswordEntity>(defaultResetPassword.clone())
    repository.remove = TestUtils.mockResolvedValue<RemovedModel>()

    await usecase.execute(input)

    const saved = jest.mocked(userRepository.create).mock.calls[0][0] as UserEntity
    expect(saved.password.password).not.toBe(input.password)
    await expect(PasswordUtils.compare(input.password, saved.password.password)).resolves.toBe(true)
    expect(session.revokeAll).toHaveBeenCalledWith(storedUser.id)
  })
})
