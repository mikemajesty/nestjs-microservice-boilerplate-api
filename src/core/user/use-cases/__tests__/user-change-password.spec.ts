/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/core/test.md
 */
import { ZodMockSchema } from '@mikemajesty/zod-mock-schema'
import { Test } from '@nestjs/testing'

import { RoleEntity, RoleEntitySchema } from '@/core/role/entity/role'
import { LoggerModule } from '@/infra/logger'
import { CreatedModel } from '@/infra/repository'
import { IUserChangePassword } from '@/modules/user/interfaces'
import { ApiBadRequestException, ApiNotFoundException } from '@/utils/exception'
import { TestUtils } from '@/utils/test/utils'
import { ZodExceptionIssue } from '@/utils/validator'

import { UserEntity, UserEntitySchema } from '../../entity/user'
import { UserPasswordEntity, UserPasswordEntitySchema } from '../../entity/user-password'
import { IUserRepository } from '../../repository/user'
import { UserChangePasswordInput, UserChangePasswordSchema, UserChangePasswordUsecase } from '../user-change-password'

describe(UserChangePasswordUsecase.name, () => {
  let usecase: IUserChangePassword
  let repository: IUserRepository

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [
        TestUtils.mockProvider(IUserRepository),
        {
          provide: IUserChangePassword,
          useFactory: (userRepository: IUserRepository) => {
            return new UserChangePasswordUsecase(userRepository)
          },
          inject: [IUserRepository]
        }
      ]
    }).compile()

    usecase = app.get(IUserChangePassword)
    repository = app.get(IUserRepository)
  })

  test('when no input is specified, should expect an error', async () => {
    await TestUtils.expectZodError(
      () => usecase.execute({} as UserChangePasswordInput),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([
          {
            message: 'Invalid input: expected string, received undefined',
            path: TestUtils.nameOf<UserChangePasswordInput>('id')
          },
          {
            message: 'Invalid input: expected string, received undefined',
            path: TestUtils.nameOf<UserChangePasswordInput>('password')
          },
          {
            message: 'Invalid input: expected string, received undefined',
            path: TestUtils.nameOf<UserChangePasswordInput>('newPassword')
          },
          {
            message: 'Invalid input: expected string, received undefined',
            path: TestUtils.nameOf<UserChangePasswordInput>('confirmPassword')
          }
        ])
      }
    )
  })

  const userChangePasswordSchemaMock = new ZodMockSchema(UserChangePasswordSchema)
  const input = userChangePasswordSchemaMock.generate({
    overrides: {
      password: '****',
      newPassword: '****',
      confirmPassword: '****'
    }
  })
  test('when user not found, should expect an error', async () => {
    repository.findOneWithRelation = TestUtils.mockResolvedValue<UserEntity>(null)

    await expect(usecase.execute(input)).rejects.toThrow(ApiNotFoundException)
  })

  const passwordMock = new ZodMockSchema(UserPasswordEntitySchema)
  const password = passwordMock.generate({
    overrides: {
      password: '69bf0bc46f51b33377c4f3d92caf876714f6bbbe99e7544487327920873f9820'
    },
    factory: (data) => new UserPasswordEntity(data)
  })
  const roleMock = new ZodMockSchema(RoleEntitySchema)
  const role = roleMock.generate({
    overrides: {
      permissions: []
    },
    factory: (data) => new RoleEntity(data)
  })
  const userMock = new ZodMockSchema(UserEntitySchema)
  const user = userMock.generate({
    overrides: {
      password,
      roles: [role]
    },
    factory: (data) => new UserEntity(data)
  })

  test('when user password is incorrect, should expect an error', async () => {
    repository.findOneWithRelation = TestUtils.mockResolvedValue<UserEntity>(user.clone())

    await expect(usecase.execute({ ...input, password: 'wrongPassword' })).rejects.toThrow(ApiBadRequestException)
  })

  test('when user passwords are not equal, should expect an error', async () => {
    repository.findOneWithRelation = TestUtils.mockResolvedValue<UserEntity>(user.clone())

    await expect(usecase.execute({ ...input, confirmPassword: 'wrongPassword' })).rejects.toThrow(
      ApiBadRequestException
    )
  })

  test('when change password successfully, should change password', async () => {
    repository.findOneWithRelation = TestUtils.mockResolvedValue<UserEntity>(user.clone())
    repository.create = TestUtils.mockResolvedValue<CreatedModel>()

    await expect(usecase.execute(input)).resolves.toBeUndefined()
    expect(repository.create).toHaveBeenCalled()
  })
})
