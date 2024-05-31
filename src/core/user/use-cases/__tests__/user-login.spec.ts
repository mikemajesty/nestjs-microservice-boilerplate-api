import { Test } from '@nestjs/testing';

import { CryptoLibModule, ICryptoAdapter } from '@/libs/crypto';
import { ITokenAdapter, TokenLibModule } from '@/libs/token';
import { ILoginAdapter } from '@/modules/login/adapter';
import { ApiNotFoundException } from '@/utils/exception';
import { expectZodError, getMockTracing, getMockUUID } from '@/utils/tests';

import { UserEntity, UserRole } from '../../entity/user';
import { IUserRepository } from '../../repository/user';
import { LoginUsecase } from '../user-login';

const userMock = {
  id: getMockUUID(),
  email: 'admin@admin.com',
  password: '**********',
  roles: [UserRole.USER]
} as UserEntity;

describe(LoginUsecase.name, () => {
  let usecase: ILoginAdapter;
  let repository: IUserRepository;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      imports: [TokenLibModule, CryptoLibModule],
      providers: [
        {
          provide: IUserRepository,
          useValue: {}
        },
        {
          provide: ILoginAdapter,
          useFactory: (userRepository: IUserRepository, token: ITokenAdapter, crypto: ICryptoAdapter) => {
            return new LoginUsecase(userRepository, token, crypto);
          },
          inject: [IUserRepository, ITokenAdapter, ICryptoAdapter]
        }
      ]
    }).compile();

    usecase = app.get(ILoginAdapter);
    repository = app.get(IUserRepository);
  });

  test('when no input is specified, should expect an error', async () => {
    await expectZodError(
      () => usecase.execute({}, getMockTracing()),
      (issues) => {
        expect(issues).toEqual([
          { message: 'Required', path: UserEntity.nameOf('email') },
          { message: 'Required', path: UserEntity.nameOf('password') }
        ]);
      }
    );
  });

  test('when user not found, should expect an error', async () => {
    repository.findOne = jest.fn().mockResolvedValue(null);
    await expect(usecase.execute({ email: 'admin@admin.com', password: 'password' }, getMockTracing())).rejects.toThrow(
      ApiNotFoundException
    );
  });

  test('when user found, should expect a token', async () => {
    repository.findOne = jest.fn().mockResolvedValue(userMock);
    await expect(
      usecase.execute({ email: 'admin@admin.com', password: 'password' }, getMockTracing())
    ).resolves.toEqual({
      token: expect.any(String)
    });
  });
});
