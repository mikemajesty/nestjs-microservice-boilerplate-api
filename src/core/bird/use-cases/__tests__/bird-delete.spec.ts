import { Test } from '@nestjs/testing';

import { IBirdDeleteAdapter } from '@/modules/bird/adapter';
import { ApiNotFoundException } from '@/utils/exception';
import { expectZodError, generateUUID } from '@/utils/tests';

import { BirdEntity } from '../../entity/bird';
import { IBirdRepository } from '../../repository/bird';
import { BirdDeleteUsecase } from '../bird-delete';

const birdResponse = {
  id: generateUUID(),
  name: 'dummy'
} as BirdEntity;

describe('BirdDeleteUsecase', () => {
  let usecase: IBirdDeleteAdapter;
  let repository: IBirdRepository;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      imports: [],
      providers: [
        {
          provide: IBirdRepository,
          useValue: {}
        },
        {
          provide: IBirdDeleteAdapter,
          useFactory: (birdRepository: IBirdRepository) => {
            return new BirdDeleteUsecase(birdRepository);
          },
          inject: [IBirdRepository]
        }
      ]
    }).compile();

    usecase = app.get(IBirdDeleteAdapter);
    repository = app.get(IBirdRepository);
  });

  test('should throw error when invalid parameters', async () => {
    await expectZodError(
      () => usecase.execute({ id: 'uuid' }),
      (issues) => {
        expect(issues).toEqual([{ message: 'Invalid uuid', path: 'id' }]);
      }
    );
  });

  test('should throw error when bird not found', async () => {
    repository.findById = jest.fn().mockResolvedValue(null);
    await expect(usecase.execute({ id: generateUUID() })).rejects.toThrowError(ApiNotFoundException);
  });

  test('should delete successfully', async () => {
    repository.findById = jest.fn().mockResolvedValue(birdResponse);
    repository.updateOne = jest.fn();
    await expect(usecase.execute({ id: generateUUID() })).resolves.toEqual({
      ...birdResponse,
      deletedAt: expect.any(Date)
    });
  });
});
