/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/core/test.md
 */
import { ZodMockSchema } from '@mikemajesty/zod-mock-schema'
import { Test } from '@nestjs/testing'

import { RoleEntity, RoleEntitySchema } from '@/core/role/entity/role'
import { IUserGetById } from '@/modules/user/interfaces'
import { ApiNotFoundException } from '@/utils/exception'
import { MockUtils, TestUtils } from '@/utils/test'
import { ZodExceptionIssue } from '@/utils/validator'

import { UserEntity, UserEntitySchema } from '../../entity/user'
import { IUserRepository } from '../../repository/user'
import { UserGetByIdInput, UserGetByIdUsecase } from '../user-get-by-id'

describe(UserGetByIdUsecase.name, () => {
  let usecase: IUserGetById
  let repository: IUserRepository

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      imports: [],
      providers: [
        TestUtils.mockProvider(IUserRepository),
        {
          provide: IUserGetById,
          useFactory: (userRepository: IUserRepository) => {
            return new UserGetByIdUsecase(userRepository)
          },
          inject: [IUserRepository]
        }
      ]
    }).compile()

    usecase = app.get(IUserGetById)
    repository = app.get(IUserRepository)
  })

  test('when no input is specified, should expect an error', async () => {
    await TestUtils.expectZodError(
      () => usecase.execute({} as UserGetByIdInput),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([
          {
            message: 'Invalid input: expected string, received undefined',
            path: TestUtils.nameOf<UserGetByIdInput>('id')
          }
        ])
      }
    )
  })

  test('when user not found, should expect an error', async () => {
    repository.findOne = TestUtils.mockResolvedValue<UserEntity>(null)

    await expect(usecase.execute({ id: MockUtils.UUID() })).rejects.toThrow(ApiNotFoundException)
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
      roles
    },
    factory: (data) => new UserEntity(data)
  })

  test('when user getById successfully, should expect a user', async () => {
    repository.findOne = TestUtils.mockResolvedValue<UserEntity>(user.clone())

    await expect(usecase.execute({ id: MockUtils.UUID() })).resolves.toEqual(user.toData())
  })
})
