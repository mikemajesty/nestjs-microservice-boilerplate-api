import { Test } from '@nestjs/testing';

import { ILoginAdapter } from '@/modules/login/adapter';
import { ITokenAdapter, TokenModule } from '@/utils/auth';
import { ApiNotFoundException } from '@/utils/exception';

import { UserEntity, UserRole } from '../../entity/user';
import { IUserRepository } from '../../repository/user';
import { LoginUsecase } from '../user-login';

const userResponse: UserEntity = {
  id: '61cc35f3-03d9-4b7f-9c63-59f32b013ef5',
  clientId: 'clientId',
  clientSecret: 'clientSecret',
  organization: { id: '61cc35f3-03d9-4b7f-9c63-59f32b013ef5', name: 'name' },
  roles: [UserRole.USER],
  createdAt: new Date(),
  updatedAt: new Date()
};

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

  test('should throw erron when login or password not found', async () => {
    repository.findOne = jest.fn().mockResolvedValue(null);
    await expect(usecase.execute({ clientId: 'clientId', clientSecret: 'clientSecret' })).rejects.toThrowError(
      ApiNotFoundException
    );
  });

  test('should login successfully', async () => {
    repository.findOne = jest.fn().mockResolvedValue(userResponse);
    await expect(usecase.execute({ clientId: 'clientId', clientSecret: 'clientSecret' })).resolves.toEqual({
      token: expect.any(String)
    });
  });
});
