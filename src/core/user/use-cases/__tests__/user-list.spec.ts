import { ZodMockSchema } from '@mikemajesty/zod-mock-schema';
import { Test } from '@nestjs/testing';

import { RoleEntity, RoleEntitySchema } from '@/core/role/entity/role';
import { IUserListAdapter } from '@/modules/user/adapter';
import { TestUtils } from '@/utils/test/util';
import { ZodExceptionIssue } from '@/utils/validator';

import { UserEntity, UserEntitySchema } from '../../entity/user';
import { IUserRepository } from '../../repository/user';
import { UserListInput, UserListOutput, UserListUsecase } from '../user-list';

describe(UserListUsecase.name, () => {
  let usecase: IUserListAdapter;
  let repository: IUserRepository;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      imports: [],
      providers: [
        {
          provide: IUserRepository,
          useValue: {}
        },
        {
          provide: IUserListAdapter,
          useFactory: (userRepository: IUserRepository) => {
            return new UserListUsecase(userRepository);
          },
          inject: [IUserRepository]
        }
      ]
    }).compile();

    usecase = app.get(IUserListAdapter);
    repository = app.get(IUserRepository);
  });

  test('when no input is specified, should expect an error', async () => {
    await TestUtils.expectZodError(
      () => usecase.execute({} as UserListInput),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([
          {
            message: 'Invalid input: expected string, received undefined',
            path: TestUtils.nameOf<UserListInput>('search')
          }
        ]);
      }
    );
  });

  const roleMock = new ZodMockSchema(RoleEntitySchema);
  const roles = roleMock.generateMany<RoleEntity>(2, {
    overrides: {
      permissions: []
    }
  });

  const userMock = new ZodMockSchema(UserEntitySchema);
  const users = userMock.generateMany<UserEntity>(4, {
    overrides: {
      roles
    }
  });

  test('when users are found, should expect an user list', async () => {
    const output: UserListOutput = { docs: users, page: 1, limit: 1, total: 1 };
    repository.paginate = TestUtils.mockResolvedValue<UserListOutput>(output);

    await expect(usecase.execute({ limit: 1, page: 1, search: {}, sort: { createdAt: -1 } })).resolves.toEqual({
      docs: users,
      page: 1,
      limit: 1,
      total: 1
    });
  });

  test('when users not found, should expect an empty list', async () => {
    const output: UserListOutput = { docs: [], page: 1, limit: 1, total: 1 };
    repository.paginate = TestUtils.mockResolvedValue<UserListOutput>(output);

    await expect(usecase.execute({ limit: 1, page: 1, search: {}, sort: { createdAt: -1 } })).resolves.toEqual(output);
  });
});
