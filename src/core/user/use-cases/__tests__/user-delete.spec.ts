import { Test } from '@nestjs/testing';

import { IUserDeleteAdapter } from '@/modules/user/adapter';
import { ApiNotFoundException } from '@/utils/exception';
import { trancingMock } from '@/utils/tests/mocks/request';
import { userResponseMock } from '@/utils/tests/mocks/user';
import { expectZodError, generateUUID } from '@/utils/tests/tests';

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

  test('should throw error when invalid parameters', async () => {
    await expectZodError(
      () => usecase.execute({ id: 'uuid' }, trancingMock),
      (issues) => {
        expect(issues).toEqual([{ message: 'Invalid uuid', path: 'id' }]);
      }
    );
  });

  test('should throw error when user not found', async () => {
    repository.findById = jest.fn().mockResolvedValue(null);
    await expect(usecase.execute({ id: generateUUID() }, trancingMock)).rejects.toThrowError(ApiNotFoundException);
  });

  test('should delete successfully', async () => {
    repository.findById = jest.fn().mockResolvedValue(userResponseMock);
    repository.updateOne = jest.fn();
    await expect(usecase.execute({ id: generateUUID() }, trancingMock)).resolves.toEqual({
      ...userResponseMock,
      deletedAt: expect.any(Date)
    });
  });
});
