import { Test } from '@nestjs/testing';
import { TestMock } from 'test/mock';

import { RoleEntity, RoleEnum } from '@/core/role/entity/role';
import { UserEntity } from '@/core/user/entity/user';
import { IUserRepository } from '@/core/user/repository/user';
import { CreatedModel, RemovedModel } from '@/infra/repository';
import { EmitEventOutput, IEventAdapter } from '@/libs/event';
import { ITokenAdapter } from '@/libs/token';
import { IConfirmResetPasswordAdapter } from '@/modules/reset-password/adapter';
import { ApiBadRequestException, ApiNotFoundException, ApiUnauthorizedException } from '@/utils/exception';
import { ZodExceptionIssue } from '@/utils/validator';

import { ResetPasswordEntity } from '../../entity/reset-password';
import { IResetPasswordRepository } from '../../repository/reset-password';
import {
  ResetPasswordConfirmInput,
  ResetPasswordConfirmUsecase,
  ResetPasswordConfirmVerify
} from '../reset-password-confirm';

describe(ResetPasswordConfirmUsecase.name, () => {
  let usecase: IConfirmResetPasswordAdapter;
  let repository: IResetPasswordRepository;
  let userRepository: IUserRepository;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      imports: [],
      providers: [
        {
          provide: IUserRepository,
          useValue: {}
        },
        {
          provide: IResetPasswordRepository,
          useValue: {}
        },
        {
          provide: ITokenAdapter,
          useValue: {
            verify: TestMock.mockReturnValue<ResetPasswordConfirmVerify>({ id: TestMock.getMockUUID() })
          }
        },
        {
          provide: IEventAdapter,
          useValue: {
            emit: TestMock.mockResolvedValue<EmitEventOutput>()
          }
        },
        {
          provide: IConfirmResetPasswordAdapter,
          useFactory: (
            repository: IResetPasswordRepository,
            userRepository: IUserRepository,
            token: ITokenAdapter,
            event: IEventAdapter
          ) => {
            return new ResetPasswordConfirmUsecase(repository, userRepository, token, event);
          },
          inject: [IResetPasswordRepository, IUserRepository, ITokenAdapter, IEventAdapter]
        }
      ]
    }).compile();

    usecase = app.get(IConfirmResetPasswordAdapter);
    repository = app.get(IResetPasswordRepository);
    userRepository = app.get(IUserRepository);
  });

  test('when no input is specified, should expect an error', async () => {
    await TestMock.expectZodError(
      () => usecase.execute({} as ResetPasswordConfirmInput),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([
          { message: 'Required', path: TestMock.nameOf<ResetPasswordConfirmInput>('token') },
          { message: 'Required', path: TestMock.nameOf<ResetPasswordConfirmInput>('password') },
          { message: 'Required', path: TestMock.nameOf<ResetPasswordConfirmInput>('confirmPassword') }
        ]);
      }
    );
  });

  test('when password are differents, should expect an error', async () => {
    await expect(usecase.execute({ confirmPassword: '123456', password: '1234567', token: '111' })).rejects.toThrow(
      ApiBadRequestException
    );
  });

  const input: ResetPasswordConfirmInput = { confirmPassword: '123456', password: '123456', token: 'token' };

  const user = new UserEntity({
    id: TestMock.getMockUUID(),
    email: 'admin@admin.com',
    name: 'Admin',
    roles: [new RoleEntity({ id: TestMock.getMockUUID(), name: RoleEnum.USER })],
    password: { id: TestMock.getMockUUID(), password: '****' }
  });

  test('when user not found, should expect an error', async () => {
    userRepository.findOneWithRelation = TestMock.mockResolvedValue<UserEntity>(null);

    await expect(usecase.execute(input)).rejects.toThrow(ApiNotFoundException);
  });

  test('when token was expired, should expect an error', async () => {
    userRepository.findOneWithRelation = TestMock.mockResolvedValue<UserEntity>(user);
    repository.findByIdUserId = TestMock.mockResolvedValue<ResetPasswordEntity>(null);

    await expect(usecase.execute(input)).rejects.toThrow(ApiUnauthorizedException);
  });

  const defaultResetPassword = new ResetPasswordEntity({ id: TestMock.getMockUUID(), token: 'token', user });
  test('when confirm successfully, should expect a void', async () => {
    userRepository.findOneWithRelation = TestMock.mockResolvedValue<UserEntity>(user);
    userRepository.create = TestMock.mockResolvedValue<CreatedModel>();
    repository.findByIdUserId = TestMock.mockResolvedValue<ResetPasswordEntity>(defaultResetPassword);
    repository.remove = TestMock.mockResolvedValue<RemovedModel>();

    await expect(usecase.execute(input)).resolves.toBeUndefined();
    expect(userRepository.create).toHaveBeenCalled();
  });
});
