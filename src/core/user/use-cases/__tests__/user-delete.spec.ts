import { Test } from '@nestjs/testing';

import { IUserDeleteAdapter } from '@/modules/user/adapter';
import { ApiNotFoundException } from '@/utils/exception';
import { expectZodError, generateUUID } from '@/utils/tests';

import { UserEntity, UserRole } from '../../entity/user';
import { IUserRepository } from '../../repository/user';
import { UserDeleteUsecase } from '../user-delete';

const userResponse = {
  id: '61cc35f3-03d9-4b7f-9c63-59f32b013ef5',
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

  test('should throw error when invalid parameters', async () => {
    await expectZodError(
      () => usecase.execute({ id: 'uuid' }),
      (issues) => {
        expect(issues).toEqual([{ message: 'Invalid uuid', path: 'id' }]);
      }
    );
  });

  test('should throw error when user not found', async () => {
    repository.findById = jest.fn().mockResolvedValue(null);
    await expect(usecase.execute({ id: generateUUID() })).rejects.toThrowError(ApiNotFoundException);
  });

  test('should delete successfully', async () => {
    repository.findById = jest.fn().mockResolvedValue(userResponse);
    repository.updateOne = jest.fn();
    await expect(usecase.execute({ id: generateUUID() })).resolves.toEqual({
      ...userResponse,
      deletedAt: expect.any(Date)
    });
  });
});
