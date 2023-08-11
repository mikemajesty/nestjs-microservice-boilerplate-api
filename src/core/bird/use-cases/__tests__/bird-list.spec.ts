import { Test } from '@nestjs/testing';

import { IBirdListAdapter } from '@/modules/bird/adapter';
import { expectZodError, generateUUID } from '@/utils/tests';

import { BirdEntity } from '../../entity/bird';
import { IBirdRepository } from '../../repository/bird';
import { BirdListUsecase } from '../bird-list';

const birdResponse = {
  id: generateUUID(),
  name: 'dummy',
  createdAt: new Date(),
  updatedAt: new Date()
} as BirdEntity;

describe('BirdListUsecase', () => {
  let usecase: IBirdListAdapter;
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
          provide: IBirdListAdapter,
          useFactory: (birdRepository: IBirdRepository) => {
            return new BirdListUsecase(birdRepository);
          },
          inject: [IBirdRepository]
        }
      ]
    }).compile();

    usecase = app.get(IBirdListAdapter);
    repository = app.get(IBirdRepository);
  });

  test('should throw error when invalid parameters', async () => {
    await expectZodError(
      () => usecase.execute({ search: null, sort: null, limit: 10, page: 1 }),
      (issues) => {
        expect(issues).toEqual([{ message: 'Expected object, received null', path: 'sort' }]);
      }
    );
  });

  test('should list successfully', async () => {
    const response = { docs: [birdResponse], page: 1, limit: 1, total: 1 };
    repository.paginate = jest.fn().mockResolvedValue(response);
    await expect(usecase.execute({ limit: 1, page: 1, search: {}, sort: { createdAt: -1 } })).resolves.toEqual({
      docs: [birdResponse],
      page: 1,
      limit: 1,
      total: 1
    });
  });

  test('should list successfully when docs is empty', async () => {
    const response = { docs: [], page: 1, limit: 1, total: 1 };
    repository.paginate = jest.fn().mockResolvedValue(response);
    await expect(usecase.execute({ limit: 1, page: 1, search: {}, sort: { createdAt: -1 } })).resolves.toEqual(
      response
    );
  });
});
