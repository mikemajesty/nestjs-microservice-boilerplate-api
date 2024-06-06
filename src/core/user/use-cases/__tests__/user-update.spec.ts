import { Test } from '@nestjs/testing';

import { ILoggerAdapter, LoggerModule } from '@/infra/logger';
import { IUserUpdateAdapter } from '@/modules/user/adapter';
import { ApiConflictException, ApiNotFoundException } from '@/utils/exception';
import { expectZodError, getMockTracing, getMockUUID } from '@/utils/tests';

import { UserEntity, UserRole } from '../../entity/user';
import { IUserRepository } from '../../repository/user';
import { UserUpdateUsecase } from '../user-update';

const userInputMock = {
  id: getMockUUID(),
  email: 'admin@admin.com',
  roles: [UserRole.USER]
} as UserEntity;

const userOutputMock = {
  ...userInputMock,
  password: '**********'
} as UserEntity;

describe(UserUpdateUsecase.name, () => {
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

  test('when no input is specified, should expect an error', async () => {
    await expectZodError(
      () => usecase.execute({}, getMockTracing()),
      (issues) => {
        expect(issues).toEqual([{ message: 'Required', path: UserEntity.nameOf('id') }]);
      }
    );
  });

  test('when user updated successfully, should expect an user that has been updated', async () => {
    repository.findById = jest.fn().mockResolvedValue(userOutputMock);
    repository.existsOnUpdate = jest.fn().mockResolvedValue(null);
    repository.updateOne = jest.fn().mockResolvedValue(null);
    await expect(usecase.execute(userInputMock, getMockTracing())).resolves.toEqual(userOutputMock);
  });

  test('when user not found, should expect an error', async () => {
    repository.findById = jest.fn().mockResolvedValue(null);
    await expect(usecase.execute(userInputMock, getMockTracing())).rejects.toThrow(ApiNotFoundException);
  });

  test('when user already exists, should expect an error', async () => {
    repository.findById = jest.fn().mockResolvedValue(userOutputMock);
    repository.existsOnUpdate = jest.fn().mockResolvedValue(userOutputMock);
    await expect(usecase.execute(userInputMock, getMockTracing())).rejects.toThrow(ApiConflictException);
  });
});
