import { Test } from '@nestjs/testing';

import { RoleEntity, RoleEnum } from '@/core/role/entity/role';
import { CryptoLibModule, ICryptoAdapter } from '@/libs/crypto';
import { ITokenAdapter, TokenLibModule } from '@/libs/token';
import { ILoginAdapter } from '@/modules/login/adapter';
import { ApiNotFoundException } from '@/utils/exception';
import { expectZodError, getMockTracing, getMockUUID } from '@/utils/tests';

import { UserEntity } from '../../entity/user';
import { IUserRepository } from '../../repository/user';
import { LoginInput, LoginUsecase } from '../user-login';

const userDefaultOutput = {
  id: getMockUUID(),
  email: 'admin@admin.com',
  name: 'Admin',
  role: new RoleEntity({ name: RoleEnum.USER }),
  password: { id: getMockUUID(), password: '***' }
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
          { message: 'Required', path: 'password' }
        ]);
      }
    );
  });

  const defaultInput: LoginInput = { email: 'admin@admin.com', password: '****' };
  test('when user not found, should expect an error', async () => {
    repository.findOneWithRelation = jest.fn().mockResolvedValue(null);
    await expect(usecase.execute(defaultInput, getMockTracing())).rejects.toThrow(ApiNotFoundException);
  });

  test('when password is incorrect, should expect an error', async () => {
    repository.findOneWithRelation = jest.fn().mockResolvedValue(userDefaultOutput);
    await expect(usecase.execute(defaultInput, getMockTracing())).rejects.toThrow(ApiNotFoundException);
  });

  test('when user login successully, should expect a token', async () => {
    userDefaultOutput.password.password = '69bf0bc46f51b33377c4f3d92caf876714f6bbbe99e7544487327920873f9820';
    repository.findOneWithRelation = jest.fn().mockResolvedValue(userDefaultOutput);
    await expect(usecase.execute(defaultInput, getMockTracing())).resolves.toEqual({
      token: expect.any(String)
    });
  });
});
