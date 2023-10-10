import { Test } from '@nestjs/testing';

import { ILoggerAdapter, LoggerModule } from '@/infra/logger';
import { IUserUpdateAdapter } from '@/modules/user/adapter';
import { ApiConflictException, ApiNotFoundException } from '@/utils/exception';
import { trancingMock } from '@/utils/tests/mocks/request';
import { userResponseMock } from '@/utils/tests/mocks/user';
import { expectZodError } from '@/utils/tests/tests';

import { IUserRepository } from '../../repository/user';
import { UserUpdateUsecase } from '../user-update';

describe('UserUpdateUsecase', () => {
  let usecase: IUserUpdateAdapter;
  let repository: IUserRepository;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [
        {
          provide: IUserRepository,
          useValue: {}
        },
        {
          provide: IUserUpdateAdapter,
          useFactory: (userRepository: IUserRepository, logger: ILoggerAdapter) => {
            return new UserUpdateUsecase(userRepository, logger);
          },
          inject: [IUserRepository, ILoggerAdapter]
        }
      ]
    }).compile();

    usecase = app.get(IUserUpdateAdapter);
    repository = app.get(IUserRepository);
  });

  test('should throw error when invalid parameters', async () => {
    await expectZodError(
      () => usecase.execute({}, trancingMock),
      (issues) => {
        expect(issues).toEqual([{ message: 'Required', path: 'id' }]);
      }
    );
  });

  test('should update successfully', async () => {
    repository.findById = jest.fn().mockResolvedValue(userResponseMock);
    repository.existsOnUpdate = jest.fn().mockResolvedValue(null);
    repository.updateOne = jest.fn().mockResolvedValue(null);
    await expect(usecase.execute(userResponseMock, trancingMock)).resolves.toEqual(userResponseMock);
  });

  test('should throw error when user not found', async () => {
    repository.findById = jest.fn().mockResolvedValue(null);
    await expect(usecase.execute(userResponseMock, trancingMock)).rejects.toThrowError(ApiNotFoundException);
  });

  test('should throw error when user exists', async () => {
    repository.findById = jest.fn().mockResolvedValue(userResponseMock);
    repository.existsOnUpdate = jest.fn().mockResolvedValue(userResponseMock);
    await expect(usecase.execute(userResponseMock, trancingMock)).rejects.toThrowError(ApiConflictException);
  });
});
