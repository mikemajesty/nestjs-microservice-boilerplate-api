import { Test } from '@nestjs/testing';

import { ILoggerAdapter, LoggerModule } from '@/infra/logger';
import { IUserCreateAdapter } from '@/modules/user/adapter';
import { ApiConflictException } from '@/utils/exception';
import { expectZodError } from '@/utils/tests';

import { UserRole } from '../../entity/user';
import { IUserRepository } from '../../repository/user';
import { UserCreateInput, UserCreateUsecase } from '../user-create';

const user = {
  login: 'login',
  password: 'password',
  roles: [UserRole.USER]
} as UserCreateInput;

describe('UserCreateUsecase', () => {
  let usecase: IUserCreateAdapter;
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
          provide: IUserCreateAdapter,
          useFactory: (userRepository: IUserRepository, logger: ILoggerAdapter) => {
            return new UserCreateUsecase(userRepository, logger);
          },
          inject: [IUserRepository, ILoggerAdapter]
        }
      ]
    }).compile();

    usecase = app.get(IUserCreateAdapter);
    repository = app.get(IUserRepository);
  });

  test('should create successfully', async () => {
    repository.findOne = jest.fn().mockResolvedValue(null);
    repository.create = jest.fn().mockResolvedValue(user);
    repository.startSession = jest.fn().mockResolvedValue({
      commitTransaction: jest.fn()
    });

    await expect(usecase.execute(user)).resolves.toEqual(user);
  });

  test('should throw error when start transaction', async () => {
    repository.findOne = jest.fn().mockResolvedValue(null);
    repository.create = jest.fn().mockResolvedValue(user);
    repository.startSession = jest.fn().mockRejectedValue(new Error('startSessionError'));

    await expect(usecase.execute(user)).rejects.toThrowError('startSessionError');
  });

  test('should throw error when user exists', async () => {
    repository.findOne = jest.fn().mockResolvedValue(user);
    await expect(usecase.execute(user)).rejects.toThrowError(ApiConflictException);
  });

  test('should throw error when invalid parameters', async () => {
    await expectZodError(
      () => usecase.execute({}),
      (issues) => {
        expect(issues).toEqual([
          { message: 'Required', path: 'login' },
          { message: 'Required', path: 'password' },
          { message: 'Required', path: 'roles' }
        ]);
      }
    );
  });
});
