/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/main/guides/core/test.md
 */
import { ZodMockSchema } from '@mikemajesty/zod-mock-schema'
import { Test } from '@nestjs/testing'

import { PermissionEntitySchema } from '@/core/permission/entity/permission'
import { RoleEntity, RoleEnum } from '@/core/role/entity/role'
import { UserEntity, UserEntitySchema } from '@/core/user/entity/user'
import { IUserRepository } from '@/core/user/repository/user'
import { CreatedModel } from '@/infra/repository'
import { ISecretsAdapter } from '@/infra/secrets'
import { EmitEventOutput, IEventAdapter } from '@/libs/event'
import { ITokenAdapter, SignOutput } from '@/libs/token'
import { IConfirmResetPasswordAdapter, ISendEmailResetPasswordAdapter } from '@/modules/reset-password/adapter'
import { ApiNotFoundException } from '@/utils/exception'
import { TestUtils } from '@/utils/test/util'
import { ZodExceptionIssue } from '@/utils/validator'

import { ResetPasswordEntity } from '../../entity/reset-password'
import { IResetPasswordRepository } from '../../repository/reset-password'
import { ResetPasswordSendEmailInput, ResetPasswordSendEmailUsecase } from '../reset-password-send-email'

describe(ResetPasswordSendEmailUsecase.name, () => {
  let usecase: ISendEmailResetPasswordAdapter
  let repository: IResetPasswordRepository
  let userRepository: IUserRepository

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      imports: [],
      providers: [
        {
          provide: IUserRepository,
          useValue: {}
        },
        {
          provide: ISecretsAdapter,
          useValue: {
            HOST: 'localhost'
          }
        },
        {
          provide: IResetPasswordRepository,
          useValue: {}
        },
        {
          provide: ITokenAdapter,
          useValue: {
            sign: TestUtils.mockReturnValue<SignOutput>({ token: 'token' })
          }
        },
        {
          provide: IEventAdapter,
          useValue: {
            emit: TestUtils.mockResolvedValue<EmitEventOutput>()
          }
        },
        {
          provide: IConfirmResetPasswordAdapter,
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

    usecase = app.get(IConfirmResetPasswordAdapter)
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
  const user = userMock.generate<UserEntity>({
    overrides: {
      roles: [new RoleEntity({ id: TestUtils.getMockUUID(), name: RoleEnum.USER })]
    }
  })

  const resetPasswordMock = new ZodMockSchema(PermissionEntitySchema)
  const resetPassword = resetPasswordMock.generate({
    overrides: {
      name: 'create:name'
    }
  })

  test('when token was found, should expect void', async () => {
    userRepository.findOne = TestUtils.mockResolvedValue<UserEntity>(user)
    repository.findByIdUserId = TestUtils.mockResolvedValue<ResetPasswordEntity>(resetPassword)

    await expect(usecase.execute(input)).resolves.toBeUndefined()
  })

  test('when token was not found, should expect void', async () => {
    userRepository.findOne = TestUtils.mockResolvedValue<UserEntity>(user)
    repository.findByIdUserId = TestUtils.mockResolvedValue<ResetPasswordEntity>(null)
    repository.create = TestUtils.mockResolvedValue<CreatedModel>()

    await expect(usecase.execute(input)).resolves.toBeUndefined()
  })
})
