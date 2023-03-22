import { Test } from '@nestjs/testing';

import { CatsListUsecase } from '@/core/cats/use-cases/cats-list';
import { ILoggerAdapter, LoggerModule } from '@/infra/logger';
import { ICatsListAdapter } from '@/modules/cats/adapter';
import { expectZodError, generateUUID } from '@/utils/tests';

import { ICatsRepository } from '../../repository/cats';
import { CatsEntity } from './../../entity/cats';

const catResponse = {
  id: generateUUID(),
  age: 10,
  breed: 'dummy',
  name: 'dummy',
  createdAt: new Date(),
  updatedAt: new Date()
} as CatsEntity;

describe('CatsListUsecase', () => {
  let usecase: ICatsListAdapter;
  let repository: ICatsRepository;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [
        {
          provide: ICatsRepository,
          useValue: {}
        },
        {
          provide: ICatsListAdapter,
          useFactory: (userRepository: ICatsRepository) => {
            return new CatsListUsecase(userRepository);
          },
          inject: [ICatsRepository, ILoggerAdapter]
        }
      ]
    }).compile();

    usecase = app.get(ICatsListAdapter);
    repository = app.get(ICatsRepository);
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
    const response = { docs: [catResponse], page: 1, limit: 1, total: 1 };
    repository.paginate = jest.fn().mockResolvedValue(response);
    await expect(usecase.execute({ limit: 1, page: 1, search: {}, sort: { createdAt: -1 } })).resolves.toEqual({
      docs: [catResponse],
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
