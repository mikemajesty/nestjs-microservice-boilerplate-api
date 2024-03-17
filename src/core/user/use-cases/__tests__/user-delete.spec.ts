import { Test } from '@nestjs/testing';

import { IUserDeleteAdapter } from '@/modules/user/adapter';
import { ApiNotFoundException } from '@/utils/exception';
import { expectZodError, getMockTracing, getMockUUID } from '@/utils/tests';

import { UserEntity, UserRole } from '../../entity/user';
import { IUserRepository } from '../../repository/user';
import { UserDeleteUsecase } from '../user-delete';

const userMock = {
  id: getMockUUID(),
  login: 'login',
  password: '**********',
  roles: [UserRole.USER]
} as UserEntity;

describe('UserDeleteUsecase', () => {
  let usecase: IUserDeleteAdapter;
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
          provide: IUserDeleteAdapter,
          useFactory: (userRepository: IUserRepository) => {
            return new UserDeleteUsecase(userRepository);
          },
          inject: [IUserRepository]
        }
      ]
    }).compile();

    usecase = app.get(IUserDeleteAdapter);
    repository = app.get(IUserRepository);
  });

  test('when no input is specified, should expect an error', async () => {
    await expectZodError(
      () => usecase.execute({ id: 'uuid' }, getMockTracing()),
      (issues) => {
        expect(issues).toEqual([{ message: 'Invalid uuid', path: UserEntity.nameOf('id') }]);
      }
    );
  });

  test('when user not found, should expect an error', async () => {
    repository.findById = jest.fn().mockResolvedValue(null);
    await expect(usecase.execute({ id: getMockUUID() }, getMockTracing())).rejects.toThrow(ApiNotFoundException);
  });

  test('when user deleted successfully, should expect an user that has been deleted.', async () => {
    repository.findById = jest.fn().mockResolvedValue(userMock);
    repository.updateOne = jest.fn();
    await expect(usecase.execute({ id: getMockUUID() }, getMockTracing())).resolves.toEqual({
      ...userMock,
      deletedAt: expect.any(Date)
    });
  });
});
