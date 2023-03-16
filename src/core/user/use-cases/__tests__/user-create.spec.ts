import { Test } from '@nestjs/testing';

import { ILoggerAdapter, LoggerModule } from '@/infra/logger';
import { IUserCreateAdapter } from '@/modules/user/adapter';
import { UserCreateInput } from '@/modules/user/types';
import { ApiConflictException } from '@/utils/exception';
import { expectZodError } from '@/utils/tests';

import { UserRole } from '../../entity/user';
import { IUserRepository } from '../../repository/user';
import { UserCreateUsecase } from '../user-create';

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
    await expect(usecase.execute(user)).resolves.toEqual(user);
  });

  test('should throw error when user exists', async () => {
    repository.findOne = jest.fn().mockResolvedValue(user);
    await expect(usecase.execute(user)).rejects.toThrowError(ApiConflictException);
  });

  test('should throw error when invalid entity', async () => {
    await expectZodError(
      () => usecase.execute({ login: 'login' }),
      (issues) => {
        expect(issues).toEqual([
          { message: 'Required', path: 'password' },
          { message: 'Required', path: 'roles' }
        ]);
      }
    );
  });
});
