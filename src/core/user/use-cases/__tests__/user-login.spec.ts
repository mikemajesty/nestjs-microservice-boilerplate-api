import { Test } from '@nestjs/testing';

import { ITokenAdapter, TokenModule } from '@/libs/auth';
import { ILoginAdapter } from '@/modules/login/adapter';
import { ApiNotFoundException } from '@/utils/exception';
import { expectZodError } from '@/utils/tests';

import { UserEntity, UserRole } from '../../entity/user';
import { IUserRepository } from '../../repository/user';
import { LoginUsecase } from '../user-login';

const userResponse = {
  id: '61cc35f3-03d9-4b7f-9c63-59f32b013ef5',
  login: 'login',
  password: '**********',
  roles: [UserRole.USER],
  createdAt: new Date(),
  updatedAt: new Date()
} as UserEntity;

describe('LoginUsecase', () => {
  let usecase: ILoginAdapter;
  let repository: IUserRepository;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      imports: [TokenModule],
      providers: [
        {
          provide: IUserRepository,
          useValue: {}
        },
        {
          provide: ILoginAdapter,
          useFactory: (userRepository: IUserRepository, token: ITokenAdapter) => {
            return new LoginUsecase(userRepository, token);
          },
          inject: [IUserRepository, ITokenAdapter]
        }
      ]
    }).compile();

    usecase = app.get(ILoginAdapter);
    repository = app.get(IUserRepository);
  });

  test('should throw error when invalid parameters', async () => {
    await expectZodError(
      () => usecase.execute({}),
      (issues) => {
        expect(issues).toEqual([
          { message: 'Required', path: 'login' },
          { message: 'Required', path: 'password' }
        ]);
      }
    );
  });

  test('should throw erron when login or password not found', async () => {
    repository.findOne = jest.fn().mockResolvedValue(null);
    await expect(usecase.execute({ login: 'login', password: 'password' })).rejects.toThrowError(ApiNotFoundException);
  });

  test('should login successfully', async () => {
    repository.findOne = jest.fn().mockResolvedValue(userResponse);
    await expect(usecase.execute({ login: 'login', password: 'password' })).resolves.toEqual({
      token: expect.any(String)
    });
  });
});
