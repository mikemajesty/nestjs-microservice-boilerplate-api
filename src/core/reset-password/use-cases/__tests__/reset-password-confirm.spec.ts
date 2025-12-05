import { ZodMockSchema } from '@mikemajesty/zod-mock-schema';
import { Test } from '@nestjs/testing';

import { RoleEntitySchema } from '@/core/role/entity/role';
import { UserEntity, UserEntitySchema } from '@/core/user/entity/user';
import { IUserRepository } from '@/core/user/repository/user';
import { CreatedModel, RemovedModel } from '@/infra/repository';
import { EmitEventOutput, IEventAdapter } from '@/libs/event';
import { ITokenAdapter } from '@/libs/token';
import { IConfirmResetPasswordAdapter } from '@/modules/reset-password/adapter';
import { ApiBadRequestException, ApiNotFoundException, ApiUnauthorizedException } from '@/utils/exception';
import { TestUtils } from '@/utils/test/util';
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
            verify: TestUtils.mockReturnValue<ResetPasswordConfirmVerify>({ id: TestUtils.getMockUUID() })
          }
        },
        {
          provide: IEventAdapter,
          useValue: {
            emit: TestUtils.mockResolvedValue<EmitEventOutput>()
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
    await TestUtils.expectZodError(
      () => usecase.execute({} as ResetPasswordConfirmInput),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([
          { message: 'Required', path: TestUtils.nameOf<ResetPasswordConfirmInput>('token') },
          { message: 'Required', path: TestUtils.nameOf<ResetPasswordConfirmInput>('password') },
          { message: 'Required', path: TestUtils.nameOf<ResetPasswordConfirmInput>('confirmPassword') }
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

  const resetPasswordMock = new ZodMockSchema(UserEntitySchema);
  const roleMock = new ZodMockSchema(RoleEntitySchema);
  const user = resetPasswordMock.generate<UserEntity>({
    overrides: {
      roles: [
        roleMock.generate({
          overrides: {
            permissions: []
          }
        })
      ]
    }
  });

  test('when user not found, should expect an error', async () => {
    userRepository.findOneWithRelation = TestUtils.mockResolvedValue<UserEntity>(null);

    await expect(usecase.execute(input)).rejects.toThrow(ApiNotFoundException);
  });

  test('when token was expired, should expect an error', async () => {
    userRepository.findOneWithRelation = TestUtils.mockResolvedValue<UserEntity>(user);
    repository.findByIdUserId = TestUtils.mockResolvedValue<ResetPasswordEntity>(null);

    await expect(usecase.execute(input)).rejects.toThrow(ApiUnauthorizedException);
  });

  const defaultResetPassword = new ResetPasswordEntity({ id: TestUtils.getMockUUID(), token: 'token', user });
  test('when confirm successfully, should expect a void', async () => {
    userRepository.findOneWithRelation = TestUtils.mockResolvedValue<UserEntity>(user);
    userRepository.create = TestUtils.mockResolvedValue<CreatedModel>();
    repository.findByIdUserId = TestUtils.mockResolvedValue<ResetPasswordEntity>(defaultResetPassword);
    repository.remove = TestUtils.mockResolvedValue<RemovedModel>();

    await expect(usecase.execute(input)).resolves.toBeUndefined();
    expect(userRepository.create).toHaveBeenCalled();
  });
});
