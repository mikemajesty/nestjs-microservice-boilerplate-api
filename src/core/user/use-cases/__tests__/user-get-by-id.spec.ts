import { Test } from '@nestjs/testing';
import { ZodIssue } from 'zod';

import { RoleEntity, RoleEnum } from '@/core/role/entity/role';
import { IUserGetByIdAdapter } from '@/modules/user/adapter';
import { ApiNotFoundException } from '@/utils/exception';
import { TestUtils } from '@/utils/tests';

import { UserEntity } from '../../entity/user';
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
      (issues: ZodIssue[]) => {
        expect(issues).toEqual([{ message: 'Required', path: UserEntity.nameOf('id') }]);
      }
    );
  });

  test('when user not found, should expect an errror', async () => {
    repository.findOne = jest.fn().mockResolvedValue(null);

    await expect(usecase.execute({ id: TestUtils.getMockUUID() })).rejects.toThrow(ApiNotFoundException);
  });

  const user = new UserEntity({
    id: TestUtils.getMockUUID(),
    email: 'admin@admin.com',
    name: 'Admin',
    roles: [new RoleEntity({ id: TestUtils.getMockUUID(), name: RoleEnum.USER })]
  });

  test('when user getById successfully, should expect a user', async () => {
    repository.findOne = jest.fn().mockResolvedValue(user);

    await expect(usecase.execute({ id: TestUtils.getMockUUID() })).resolves.toEqual(user);
  });
});
