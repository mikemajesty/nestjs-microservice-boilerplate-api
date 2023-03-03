import { Test } from '@nestjs/testing';

import { IUserDeleteAdapter } from '@/modules/user/adapter';
import { ApiInternalServerException, ApiNotFoundException } from '@/utils/exception';

import { UserEntity, UserRole } from '../../entity/user';
import { IUserRepository } from '../../repository/user';
import { UserDeleteUsecase } from '../user-delete';

const userResponse: UserEntity = {
  id: '61cc35f3-03d9-4b7f-9c63-59f32b013ef5',
  clientId: 'clientId',
  clientSecret: 'clientSecret',
  organization: { name: 'organization', id: '61cc35f3-03d9-4b7f-9c63-59f32b013ef5' },
  roles: [UserRole.USER]
};

describe('UserDeleteUsecase', () => {
  let usecase: IUserDeleteAdapter;
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
          provide: IUserDeleteAdapter,
          useFactory: (userRepository: IUserRepository) => {
            return new UserDeleteUsecase(userRepository);
          },
          inject: [IUserRepository]
        }
      ]
    }).compile();

    usecase = app.get(IUserDeleteAdapter);
    repository = app.get(IUserRepository);
  });

  test('should throw error when user not found', async () => {
    repository.findById = jest.fn().mockResolvedValue(null);
    await expect(usecase.execute({ id: 'uuid' })).rejects.toThrowError(ApiNotFoundException);
  });

  test('should throw error when delete unsuccessfully', async () => {
    repository.findById = jest.fn().mockResolvedValue(userResponse);
    repository.remove = jest.fn().mockResolvedValue({ deleted: false });
    await expect(usecase.execute({ id: 'uuid' })).rejects.toThrowError(ApiInternalServerException);
  });

  test('should delete successfully', async () => {
    repository.findById = jest.fn().mockResolvedValue(userResponse);
    repository.remove = jest.fn().mockResolvedValue({ deleted: true });
    await expect(usecase.execute({ id: 'uuid' })).resolves.toEqual(userResponse);
  });
});
