import { Test } from '@nestjs/testing';

import { IUserDeleteAdapter } from '@/modules/user/adapter';
import { ApiNotFoundException } from '@/utils/exception';
import { RequestMock } from '@/utils/tests/mocks/request';
import { UserResponseMock } from '@/utils/tests/mocks/user';
import { expectZodError, generateUUID } from '@/utils/tests/tests';

import { UserEntity } from '../../entity/user';
import { IUserRepository } from '../../repository/user';
import { UserDeleteUsecase } from '../user-delete';

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
      () => usecase.execute({ id: 'uuid' }, RequestMock.trancingMock),
      (issues) => {
        expect(issues).toEqual([{ message: 'Invalid uuid', path: UserEntity.nameof('id') }]);
      }
    );
  });

  test('when user not found, should expect an error', async () => {
    repository.findById = jest.fn().mockResolvedValue(null);
    await expect(usecase.execute({ id: generateUUID() }, RequestMock.trancingMock)).rejects.toThrowError(
      ApiNotFoundException
    );
  });

  test('when user deleted successfully, should expect an user that has been deleted.', async () => {
    repository.findById = jest.fn().mockResolvedValue(UserResponseMock.userMock);
    repository.updateOne = jest.fn();
    await expect(usecase.execute({ id: generateUUID() }, RequestMock.trancingMock)).resolves.toEqual({
      ...UserResponseMock.userMock,
      deletedAt: expect.any(Date)
    });
  });
});
