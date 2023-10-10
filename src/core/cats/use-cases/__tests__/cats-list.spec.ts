import { Test } from '@nestjs/testing';

import { CatsListUsecase } from '@/core/cats/use-cases/cats-list';
import { ILoggerAdapter, LoggerModule } from '@/infra/logger';
import { ICatsListAdapter } from '@/modules/cats/adapter';
import { catsResponseMock } from '@/utils/tests/mocks/cats';
import { expectZodError } from '@/utils/tests/tests';

import { ICatsRepository } from '../../repository/cats';

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
          useFactory: (catsRepository: ICatsRepository) => {
            return new CatsListUsecase(catsRepository);
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
    const response = { docs: [catsResponseMock], page: 1, limit: 1, total: 1 };
    repository.paginate = jest.fn().mockResolvedValue(response);
    await expect(usecase.execute({ limit: 1, page: 1, search: {}, sort: { createdAt: -1 } })).resolves.toEqual({
      docs: [catsResponseMock],
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
