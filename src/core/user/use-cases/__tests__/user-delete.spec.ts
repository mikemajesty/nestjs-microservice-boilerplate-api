import { ZodMockSchema } from '@mikemajesty/zod-mock-schema'
import { Test } from '@nestjs/testing'

import { RoleEntity, RoleEntitySchema } from '@/core/role/entity/role'
import { IUserDeleteAdapter } from '@/modules/user/adapter'
import { ApiNotFoundException } from '@/utils/exception'
import { TestUtils } from '@/utils/test/util'
import { ZodExceptionIssue } from '@/utils/validator'

import { UserEntity, UserEntitySchema } from '../../entity/user'
import { IUserRepository } from '../../repository/user'
import { UserDeleteInput, UserDeleteUsecase } from '../user-delete'

describe(UserDeleteUsecase.name, () => {
  let usecase: IUserDeleteAdapter
  let repository: IUserRepository

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      imports: [],
      providers: [
        {
          provide: IUserRepository,
          useValue: {}
        },
        {
          provide: IUserDeleteAdapter,
          useFactory: (userRepository: IUserRepository) => {
            return new UserDeleteUsecase(userRepository)
          },
          inject: [IUserRepository]
        }
      ]
    }).compile()

    usecase = app.get(IUserDeleteAdapter)
    repository = app.get(IUserRepository)
  })

  test('when no input is specified, should expect an error', async () => {
    await TestUtils.expectZodError(
      () => usecase.execute({ id: 'uuid' } as UserDeleteInput, TestUtils.getMockTracing()),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([{ message: 'Invalid UUID', path: TestUtils.nameOf<UserDeleteInput>('id') }])
      }
    )
  })

  test('when user not found, should expect an error', async () => {
    repository.findOneWithRelation = TestUtils.mockResolvedValue<UserEntity>(null)

    await expect(usecase.execute({ id: TestUtils.getMockUUID() }, TestUtils.getMockTracing())).rejects.toThrow(
      ApiNotFoundException
    )
  })

  const roleMock = new ZodMockSchema(RoleEntitySchema)
  const roles = roleMock.generateMany<RoleEntity>(2, {
    overrides: {
      permissions: []
    }
  })

  const userMock = new ZodMockSchema(UserEntitySchema)
  const user = userMock.generate<UserEntity>({
    overrides: {
      roles
    }
  })

  test('when user deleted successfully, should expect an user deleted', async () => {
    repository.findOneWithRelation = TestUtils.mockResolvedValue<UserEntity>(user)
    repository.softRemove = TestUtils.mockResolvedValue<UserEntity>()

    await expect(usecase.execute({ id: TestUtils.getMockUUID() }, TestUtils.getMockTracing())).resolves.toEqual(
      expect.any(Object)
    )
    expect(repository.softRemove).toHaveBeenCalled()
  })
})
