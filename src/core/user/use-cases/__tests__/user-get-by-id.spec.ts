import { Test } from '@nestjs/testing';

import { RoleEntity, RoleEnum } from '@/core/role/entity/role';
import { IUserGetByIdAdapter } from '@/modules/user/adapter';
import { ApiNotFoundException } from '@/utils/exception';
import { expectZodError, getMockUUID } from '@/utils/tests';

import { UserEntity } from '../../entity/user';
import { IUserRepository } from '../../repository/user';
import { UserGetByIdUsecase } from '../user-get-by-id';

const userMock = {
  id: getMockUUID(),
  email: 'admin@admin.com',
  name: 'Admin',
  role: new RoleEntity({ name: RoleEnum.USER })
} as UserEntity;

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
    await expectZodError(
      () => usecase.execute({}),
      (issues) => {
        expect(issues).toEqual([{ message: 'Required', path: UserEntity.nameOf('id') }]);
      }
    );
  });

  test('when user not found, should expect an errror', async () => {
    repository.findOneWithRelation = jest.fn().mockResolvedValue(null);
    await expect(usecase.execute({ id: getMockUUID() })).rejects.toThrow(ApiNotFoundException);
  });

  test('when user getById successfully, should expect a user', async () => {
    repository.findOneWithRelation = jest.fn().mockResolvedValue(userMock);
    await expect(usecase.execute({ id: getMockUUID() })).resolves.toEqual(userMock);
  });
});
