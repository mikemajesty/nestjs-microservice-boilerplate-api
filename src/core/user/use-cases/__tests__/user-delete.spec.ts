/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/core/test.md
 */
import { ZodMockSchema } from '@mikemajesty/zod-mock-schema'
import { Test } from '@nestjs/testing'

import { RoleEntity, RoleEntitySchema } from '@/core/role/entity/role'
import { ICacheAsideAdapter } from '@/infra/cache/aside'
import { IUserDelete } from '@/modules/user/interfaces'
import { ApiNotFoundException } from '@/utils/exception'
import { MockUtils, TestUtils } from '@/utils/test'
import { ZodExceptionIssue } from '@/utils/validator'

import { UserEntity, UserEntitySchema } from '../../entity/user'
import { IUserRepository } from '../../repository/user'
import { UserDeleteInput, UserDeleteUsecase } from '../user-delete'

describe(UserDeleteUsecase.name, () => {
  let usecase: IUserDelete
  let repository: IUserRepository

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      imports: [],
      providers: [
        TestUtils.mockProvider(IUserRepository),
        TestUtils.mockProvider(ICacheAsideAdapter, {
          invalidate: TestUtils.mockResolvedValue()
        }),
        {
          provide: IUserDelete,
          useFactory: (userRepository: IUserRepository, cacheAside: ICacheAsideAdapter) => {
            return new UserDeleteUsecase(userRepository, cacheAside)
          },
          inject: [IUserRepository, ICacheAsideAdapter]
        }
      ]
    }).compile()

    usecase = app.get(IUserDelete)
    repository = app.get(IUserRepository)
  })

  test('when no input is specified, should expect an error', async () => {
    await TestUtils.expectZodError(
      () => usecase.execute({ id: 'uuid' } as UserDeleteInput, MockUtils.Tracing()),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([{ message: 'Invalid UUID', path: TestUtils.nameOf<UserDeleteInput>('id') }])
      }
    )
  })

  test('when user not found, should expect an error', async () => {
    repository.findOneWithRelation = TestUtils.mockResolvedValue<UserEntity>(null)

    await expect(usecase.execute({ id: MockUtils.UUID() }, MockUtils.Tracing())).rejects.toThrow(ApiNotFoundException)
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

    await expect(usecase.execute({ id: MockUtils.UUID() }, MockUtils.Tracing())).resolves.toEqual(expect.any(Object))
    expect(repository.softRemove).toHaveBeenCalled()
  })
})
