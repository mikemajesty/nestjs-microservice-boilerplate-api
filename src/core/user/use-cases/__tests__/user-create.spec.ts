import { Test } from '@nestjs/testing';

import { ILoggerAdapter, LoggerModule } from '@/infra/logger';
import { IUserCreateAdapter } from '@/modules/user/adapter';
import { ApiConflictException } from '@/utils/exception';
import { RequestMock } from '@/utils/tests/mocks/request';
import { expectZodError, getMockUUID } from '@/utils/tests/tests';

import { UserEntity, UserRole } from '../../entity/user';
import { IUserRepository } from '../../repository/user';
import { UserCreateUsecase } from '../user-create';

const userMock = new UserEntity({
  id: getMockUUID(),
  login: 'login',
  password: '**********',
  roles: [UserRole.USER]
});

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

  test('when the user is created successfully, should expect an user that has been created', async () => {
    repository.findOne = jest.fn().mockResolvedValue(null);
    repository.create = jest.fn().mockResolvedValue(userMock);
    repository.startSession = jest.fn().mockResolvedValue({
      commitTransaction: jest.fn()
    });

    await expect(usecase.execute(userMock, RequestMock.trancingMock)).resolves.toEqual(userMock);
  });

  test('when transaction throw an error, should expect an error', async () => {
    repository.findOne = jest.fn().mockResolvedValue(null);
    repository.create = jest.fn().mockResolvedValue(userMock);
    repository.startSession = jest.fn().mockRejectedValue(new Error('startSessionError'));

    await expect(usecase.execute(userMock, RequestMock.trancingMock)).rejects.toThrowError('startSessionError');
  });

  test('when user already exists, should expect an error', async () => {
    repository.findOne = jest.fn().mockResolvedValue(userMock);
    await expect(usecase.execute(userMock, RequestMock.trancingMock)).rejects.toThrowError(ApiConflictException);
  });

  test('when no input is specified, should expect an error', async () => {
    await expectZodError(
      () => usecase.execute({}, RequestMock.trancingMock),
      (issues) => {
        expect(issues).toEqual([
          { message: 'Required', path: UserEntity.nameOf('login') },
          { message: 'Required', path: UserEntity.nameOf('password') },
          { message: 'Required', path: UserEntity.nameOf('roles') }
        ]);
      }
    );
  });
});
