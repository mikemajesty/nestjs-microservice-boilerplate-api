import { Test } from '@nestjs/testing';

import { ILoggerAdapter, LoggerModule } from '@/infra/logger';
import { IUserUpdateAdapter } from '@/modules/user/adapter';
import { UserUpdateInput } from '@/modules/user/types';
import { ApiConflictException, ApiNotFoundException } from '@/utils/exception';

import { UserEntity, UserRole } from '../../entity/user';
import { IUserRepository } from '../../repository/user';
import { UserUpdateUsecase } from '../user-update';

const userBody: UserUpdateInput = {
  id: '61cc35f3-03d9-4b7f-9c63-59f32b013ef5',
  login: 'login',
  password: 'password',
  roles: [UserRole.USER]
};
const userResponse: UserEntity = {
  id: '61cc35f3-03d9-4b7f-9c63-59f32b013ef5',
  login: 'login',
  password: 'password',
  roles: [UserRole.USER]
};

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

  test('should update successfully', async () => {
    repository.findById = jest.fn().mockResolvedValue(userResponse);
    repository.existsOnUpdate = jest.fn().mockResolvedValue(null);
    repository.updateOne = jest.fn().mockResolvedValue(null);
    await expect(usecase.execute(userBody)).resolves.toEqual(userResponse);
  });

  test('should throw error when user not found', async () => {
    repository.findById = jest.fn().mockResolvedValue(null);
    await expect(usecase.execute(userBody)).rejects.toThrowError(ApiNotFoundException);
  });

  test('should throw error when user exists', async () => {
    repository.findById = jest.fn().mockResolvedValue(userResponse);
    repository.existsOnUpdate = jest.fn().mockResolvedValue(userResponse);
    await expect(usecase.execute(userBody)).rejects.toThrowError(ApiConflictException);
  });
});
