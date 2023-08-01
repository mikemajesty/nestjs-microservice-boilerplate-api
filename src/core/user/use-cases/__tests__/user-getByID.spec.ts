import { Test } from '@nestjs/testing';

import { IUserGetByIDAdapter } from '@/modules/user/adapter';
import { ApiNotFoundException } from '@/utils/exception';
import { userResponseMock } from '@/utils/mocks/user';
import { expectZodError, generateUUID } from '@/utils/tests';

import { IUserRepository } from '../../repository/user';
import { UserGetByIdUsecase } from '../user-getByID';

describe('UserGetByIdUsecase', () => {
  let usecase: IUserGetByIDAdapter;
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
          provide: IUserGetByIDAdapter,
          useFactory: (userRepository: IUserRepository) => {
            return new UserGetByIdUsecase(userRepository);
          },
          inject: [IUserRepository]
        }
      ]
    }).compile();

    usecase = app.get(IUserGetByIDAdapter);
    repository = app.get(IUserRepository);
  });

  test('should throw error when invalid parameters', async () => {
    await expectZodError(
      () => usecase.execute({}),
      (issues) => {
        expect(issues).toEqual([{ message: 'Required', path: 'id' }]);
      }
    );
  });

  test('should throw error when user not found', async () => {
    repository.findById = jest.fn().mockResolvedValue(null);
    await expect(usecase.execute({ id: generateUUID() })).rejects.toThrowError(ApiNotFoundException);
  });

  test('should getById successfully', async () => {
    repository.findById = jest.fn().mockResolvedValue(userResponseMock);
    await expect(usecase.execute({ id: generateUUID() })).resolves.toEqual(userResponseMock);
  });
});
