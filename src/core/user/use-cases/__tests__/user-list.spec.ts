import { Test } from '@nestjs/testing';
import { TestMock } from 'test/mock';

import { RoleEntity, RoleEnum } from '@/core/role/entity/role';
import { IUserListAdapter } from '@/modules/user/adapter';
import { ZodExceptionIssue } from '@/utils/validator';

import { UserEntity } from '../../entity/user';
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
    await TestMock.expectZodError(
      () => usecase.execute({} as UserListInput),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([{ message: 'Required', path: TestMock.nameOf<UserListInput>('search') }]);
      }
    );
  });

  const user = new UserEntity({
    id: TestMock.getMockUUID(),
    email: 'admin@admin.com',
    name: 'Admin',
    roles: [new RoleEntity({ id: TestMock.getMockUUID(), name: RoleEnum.USER })]
  });

  const users = [
    {
      ...user,
      createdAt: TestMock.getMockDate(),
      updatedAt: TestMock.getMockDate(),
      deletedAt: null
    } as UserEntity
  ];

  test('when users are found, should expect an user list', async () => {
    const output: UserListOutput = { docs: users, page: 1, limit: 1, total: 1 };
    repository.paginate = TestMock.mockResolvedValue<UserListOutput>(output);

    await expect(usecase.execute({ limit: 1, page: 1, search: {}, sort: { createdAt: -1 } })).resolves.toEqual({
      docs: users,
      page: 1,
      limit: 1,
      total: 1
    });
  });

  test('when users not found, should expect an empty list', async () => {
    const output: UserListOutput = { docs: [], page: 1, limit: 1, total: 1 };
    repository.paginate = TestMock.mockResolvedValue<UserListOutput>(output);

    await expect(usecase.execute({ limit: 1, page: 1, search: {}, sort: { createdAt: -1 } })).resolves.toEqual(output);
  });
});
