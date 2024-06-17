import { Test } from '@nestjs/testing';

import { RoleEntity, RoleEnum } from '@/core/role/entity/role';
import { IUserListAdapter } from '@/modules/user/adapter';
import { expectZodError, getMockDate, getMockUUID } from '@/utils/tests';

import { UserEntity } from '../../entity/user';
import { IUserRepository } from '../../repository/user';
import { UserListUsecase } from '../user-list';

const userMock = {
  id: getMockUUID(),
  email: 'admin@admin.com',
  name: 'Admin',
  role: new RoleEntity({ name: RoleEnum.USER })
} as UserEntity;

const usersMock = [
  {
    ...userMock,
    createdAt: getMockDate(),
    updatedAt: getMockDate(),
    deletedAt: null
  } as UserEntity
];
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
    await expectZodError(
      () => usecase.execute({ search: null, sort: null, limit: 10, page: 1 }),
      (issues) => {
        expect(issues).toEqual([{ message: 'Expected object, received null', path: 'sort' }]);
      }
    );
  });

  test('when users are found, should expect an user list', async () => {
    const response = { docs: usersMock, page: 1, limit: 1, total: 1 };
    repository.paginate = jest.fn().mockResolvedValue(response);
    await expect(usecase.execute({ limit: 1, page: 1, search: {}, sort: { createdAt: -1 } })).resolves.toEqual({
      docs: usersMock,
      page: 1,
      limit: 1,
      total: 1
    });
  });

  test('when users not found, should expect an empty list', async () => {
    const response = { docs: [], page: 1, limit: 1, total: 1 };
    repository.paginate = jest.fn().mockResolvedValue(response);
    await expect(usecase.execute({ limit: 1, page: 1, search: {}, sort: { createdAt: -1 } })).resolves.toEqual(
      response
    );
  });
});
