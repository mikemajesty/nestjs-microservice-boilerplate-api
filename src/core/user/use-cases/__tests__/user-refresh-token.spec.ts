import { Test } from '@nestjs/testing';
import { ZodIssue } from 'zod';

import { RoleEntity, RoleEnum } from '@/core/role/entity/role';
import { ITokenAdapter } from '@/libs/token';
import { IRefreshTokenAdapter } from '@/modules/login/adapter';
import { ApiBadRequestException, ApiNotFoundException } from '@/utils/exception';
import { TestUtils } from '@/utils/tests';

import { UserEntity } from '../../entity/user';
import { IUserRepository } from '../../repository/user';
import { RefreshTokenInput, RefreshTokenOutput, RefreshTokenUsecase } from '../user-refresh-token';

describe(RefreshTokenUsecase.name, () => {
  let usecase: IRefreshTokenAdapter;
  let repository: IUserRepository;
  let token: ITokenAdapter;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      imports: [],
      providers: [
        {
          provide: IUserRepository,
          useValue: {}
        },
        {
          provide: ITokenAdapter,
          useValue: {}
        },
        {
          provide: IRefreshTokenAdapter,
          useFactory: (repository: IUserRepository, token: ITokenAdapter) => {
            return new RefreshTokenUsecase(repository, token);
          },
          inject: [IUserRepository, ITokenAdapter]
        }
      ]
    }).compile();

    usecase = app.get(IRefreshTokenAdapter);
    repository = app.get(IUserRepository);
    token = app.get(ITokenAdapter);
  });

  test('when no input is specified, should expect an error', async () => {
    await TestUtils.expectZodError(
      () => usecase.execute({} as RefreshTokenInput),
      (issues: ZodIssue[]) => {
        expect(issues).toEqual([{ message: 'Required', path: 'refreshToken' }]);
      }
    );
  });

  const input: RefreshTokenInput = { refreshToken: '<token>' };
  test('when token is incorrect, should expect an error', async () => {
    token.verify = jest.fn().mockResolvedValue({ userId: null });
    repository.findOne = jest.fn().mockResolvedValue(null);

    await expect(usecase.execute(input)).rejects.toThrow(ApiBadRequestException);
  });

  test('when user not found, should expect an error', async () => {
    token.verify = jest.fn().mockResolvedValue({ userId: TestUtils.getMockUUID() });
    repository.findOne = jest.fn().mockResolvedValue(null);

    await expect(usecase.execute(input)).rejects.toThrow(ApiNotFoundException);
  });

  const user = new UserEntity({
    id: TestUtils.getMockUUID(),
    email: 'admin@admin.com',
    name: 'Admin',
    roles: [new RoleEntity({ id: TestUtils.getMockUUID(), name: RoleEnum.USER })],
    password: { id: TestUtils.getMockUUID(), password: '***' }
  });

  test('when user role not found, should expect an error', async () => {
    token.verify = jest.fn().mockResolvedValue({ userId: TestUtils.getMockUUID() });
    repository.findOne = jest.fn().mockResolvedValue({ ...user, roles: [] });

    await expect(usecase.execute(input)).rejects.toThrow(ApiNotFoundException);
  });

  test('when user refresh token successfully, should expect a token', async () => {
    token.verify = jest.fn().mockResolvedValue({ userId: TestUtils.getMockUUID() });
    token.sign = jest.fn().mockReturnValue({ token: '<token>' });
    user.password.password = '69bf0bc46f51b33377c4f3d92caf876714f6bbbe99e7544487327920873f9820';
    repository.findOne = jest.fn().mockResolvedValue(user);

    await expect(usecase.execute(input)).resolves.toEqual({
      accessToken: expect.any(String),
      refreshToken: expect.any(String)
    } as RefreshTokenOutput);
  });
});
