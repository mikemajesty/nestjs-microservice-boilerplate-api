import { Test } from '@nestjs/testing';

import { IBirdGetByIDAdapter } from '@/modules/bird/adapter';
import { ApiNotFoundException } from '@/utils/exception';
import { expectZodError, generateUUID } from '@/utils/tests';

import { BirdEntity } from '../../entity/bird';
import { IBirdRepository } from '../../repository/bird';
import { BirdGetByIdUsecase } from '../bird-getByID';

const birdResponse = {
  id: '61cc35f3-03d9-4b7f-9c63-59f32b013ef5',
  name: 'dummy'
} as BirdEntity;

describe('BirdGetByIdUsecase', () => {
  let usecase: IBirdGetByIDAdapter;
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
          provide: IBirdGetByIDAdapter,
          useFactory: (birdRepository: IBirdRepository) => {
            return new BirdGetByIdUsecase(birdRepository);
          },
          inject: [IBirdRepository]
        }
      ]
    }).compile();

    usecase = app.get(IBirdGetByIDAdapter);
    repository = app.get(IBirdRepository);
  });

  test('should throw error when invalid parameters', async () => {
    await expectZodError(
      () => usecase.execute({}),
      (issues) => {
        expect(issues).toEqual([{ message: 'Required', path: 'id' }]);
      }
    );
  });

  test('should throw error when bird not found', async () => {
    repository.findById = jest.fn().mockResolvedValue(null);
    await expect(usecase.execute({ id: generateUUID() })).rejects.toThrowError(ApiNotFoundException);
  });

  test('should getById successfully', async () => {
    repository.findById = jest.fn().mockResolvedValue(birdResponse);
    await expect(usecase.execute({ id: generateUUID() })).resolves.toEqual(birdResponse);
  });
});
