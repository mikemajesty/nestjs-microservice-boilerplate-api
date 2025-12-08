import { ZodMockSchema } from '@mikemajesty/zod-mock-schema';
import { Test } from '@nestjs/testing';

import { RoleEntity, RoleEntitySchema } from '@/core/role/entity/role';
import { IUserGetByIdAdapter } from '@/modules/user/adapter';
import { ApiNotFoundException } from '@/utils/exception';
import { TestUtils } from '@/utils/test/util';
import { ZodExceptionIssue } from '@/utils/validator';

import { UserEntity, UserEntitySchema } from '../../entity/user';
import { IUserRepository } from '../../repository/user';
import { UserGetByIdInput, UserGetByIdUsecase } from '../user-get-by-id';

describe(UserGetByIdUsecase.name, () => {
  let usecase: IUserGetByIdAdapter;
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
          provide: IUserGetByIdAdapter,
          useFactory: (userRepository: IUserRepository) => {
            return new UserGetByIdUsecase(userRepository);
          },
          inject: [IUserRepository]
        }
      ]
    }).compile();

    usecase = app.get(IUserGetByIdAdapter);
    repository = app.get(IUserRepository);
  });

  test('when no input is specified, should expect an error', async () => {
    await TestUtils.expectZodError(
      () => usecase.execute({} as UserGetByIdInput),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([
          {
            message: 'Invalid input: expected string, received undefined',
            path: TestUtils.nameOf<UserGetByIdInput>('id')
          }
        ]);
      }
    );
  });

  test('when user not found, should expect an errror', async () => {
    repository.findOne = TestUtils.mockResolvedValue<UserEntity>(null);

    await expect(usecase.execute({ id: TestUtils.getMockUUID() })).rejects.toThrow(ApiNotFoundException);
  });

  const roleMock = new ZodMockSchema(RoleEntitySchema);
  const roles = roleMock.generateMany<RoleEntity>(2, {
    overrides: {
      permissions: []
    }
  });

  const userMock = new ZodMockSchema(UserEntitySchema);
  const user = userMock.generate<UserEntity>({
    overrides: {
      roles
    }
  });

  test('when user getById successfully, should expect a user', async () => {
    repository.findOne = TestUtils.mockResolvedValue<UserEntity>(user);

    await expect(usecase.execute({ id: TestUtils.getMockUUID() })).resolves.toEqual(user);
  });
});
