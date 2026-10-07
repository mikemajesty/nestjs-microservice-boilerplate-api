/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/core/test.md
 */
import { ZodMockSchema } from '@mikemajesty/zod-mock-schema'
import { Test } from '@nestjs/testing'

import { RoleEntity, RoleEnum } from '@/core/role/entity/role'
import { UserEntity, UserEntitySchema } from '@/core/user/entity/user'
import { IUserRepository } from '@/core/user/repository/user'
import { CreatedModel } from '@/infra/repository'
import { ISecretsAdapter } from '@/infra/secrets'
import { EmitEventOutput, IEventAdapter } from '@/libs/event'
import { ITokenAdapter, TokenSignOutput } from '@/libs/token'
import { ISendEmailResetPassword } from '@/modules/reset-password/interfaces'
import { ApiNotFoundException } from '@/utils/exception'
import { MockUtils, TestUtils } from '@/utils/test'
import { ZodExceptionIssue } from '@/utils/validator'

import { ResetPasswordEntity, ResetPasswordEntitySchema } from '../../entity/reset-password'
import { IResetPasswordRepository } from '../../repository/reset-password'
import { ResetPasswordSendEmailInput, ResetPasswordSendEmailUsecase } from '../reset-password-send-email'

describe(ResetPasswordSendEmailUsecase.name, () => {
  let usecase: ISendEmailResetPassword
  let repository: IResetPasswordRepository
  let userRepository: IUserRepository

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      imports: [],
      providers: [
        TestUtils.mockProvider(IUserRepository),
        TestUtils.mockProvider(IResetPasswordRepository),
        TestUtils.mockProvider(ITokenAdapter, {
          sign: TestUtils.mockReturnValue<TokenSignOutput>({ token: 'token' })
        }),
        TestUtils.mockProvider(IEventAdapter, {
          emit: TestUtils.mockReturnValue<EmitEventOutput>()
        }),
        TestUtils.mockProvider(ISecretsAdapter, {
          HOST: 'localhost'
        }),
        {
          provide: ISendEmailResetPassword,
          useFactory: (
            repository: IResetPasswordRepository,
            userRepository: IUserRepository,
            token: ITokenAdapter,
            event: IEventAdapter,
            secret: ISecretsAdapter
          ) => {
            return new ResetPasswordSendEmailUsecase(repository, userRepository, token, event, secret)
          },
          inject: [IResetPasswordRepository, IUserRepository, ITokenAdapter, IEventAdapter, ISecretsAdapter]
        }
      ]
    }).compile()

    usecase = app.get(ISendEmailResetPassword)
    repository = app.get(IResetPasswordRepository)
    userRepository = app.get(IUserRepository)
  })

  test('when no input is specified, should expect an error', async () => {
    await TestUtils.expectZodError(
      () => usecase.execute({} as ResetPasswordSendEmailInput),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([
          {
            message: 'Invalid input: expected string, received undefined',
            path: TestUtils.nameOf<ResetPasswordSendEmailInput>('email')
          }
        ])
      }
    )
  })

  const input: ResetPasswordSendEmailInput = { email: 'admin@admin.com' }

  test('when user not found, should expect an error', async () => {
    userRepository.findOne = TestUtils.mockResolvedValue<UserEntity>(null)

    await expect(usecase.execute(input)).rejects.toThrow(ApiNotFoundException)
  })

  const userMock = new ZodMockSchema(UserEntitySchema)
  const user = userMock.generate({
    overrides: {
      roles: [new RoleEntity({ id: MockUtils.UUID(), name: RoleEnum.USER })]
    },
    factory: (data) => new UserEntity(data)
  })

  const resetPasswordMock = new ZodMockSchema(ResetPasswordEntitySchema)
  const resetPassword = resetPasswordMock.generate({
    overrides: {
      user
    },
    factory: (data) => new ResetPasswordEntity(data)
  })

  test('when token was found, should expect void', async () => {
    userRepository.findOne = TestUtils.mockResolvedValue<UserEntity>(user.clone())
    repository.findByIdUserId = TestUtils.mockResolvedValue<ResetPasswordEntity>(resetPassword.clone())

    await expect(usecase.execute(input)).resolves.toBeUndefined()
  })

  test('when token was not found, should expect void', async () => {
    userRepository.findOne = TestUtils.mockResolvedValue<UserEntity>(user.clone())
    repository.findByIdUserId = TestUtils.mockResolvedValue<ResetPasswordEntity>(null)
    repository.create = TestUtils.mockResolvedValue<CreatedModel>()

    await expect(usecase.execute(input)).resolves.toBeUndefined()
  })
})
