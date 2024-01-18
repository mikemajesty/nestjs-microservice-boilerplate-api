import { Test } from '@nestjs/testing';

import { ITokenAdapter, TokenModule } from '@/libs/auth';
import { ILoginAdapter } from '@/modules/login/adapter';
import { ApiNotFoundException } from '@/utils/exception';
import { RequestMock } from '@/utils/tests/mocks/request';
import { expectZodError, getMockUUID } from '@/utils/tests/tests';

import { UserEntity, UserRole } from '../../entity/user';
import { IUserRepository } from '../../repository/user';
import { LoginUsecase } from '../user-login';

const userMock = new UserEntity({
  id: getMockUUID(),
  login: 'login',
  password: '**********',
  roles: [UserRole.USER]
});

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

  test('when no input is specified, should expect an error', async () => {
    await expectZodError(
      () => usecase.execute({}, RequestMock.trancingMock),
      (issues) => {
        expect(issues).toEqual([
          { message: 'Required', path: UserEntity.nameOf('login') },
          { message: 'Required', path: UserEntity.nameOf('password') }
        ]);
      }
    );
  });

  test('when user not found, should expect an error', async () => {
    repository.findOne = jest.fn().mockResolvedValue(null);
    await expect(
      usecase.execute({ login: 'login', password: 'password' }, RequestMock.trancingMock)
    ).rejects.toThrowError(ApiNotFoundException);
  });

  test('when user found, should expect a token', async () => {
    repository.findOne = jest.fn().mockResolvedValue(userMock);
    await expect(usecase.execute({ login: 'login', password: 'password' }, RequestMock.trancingMock)).resolves.toEqual({
      token: expect.any(String)
    });
  });
});
