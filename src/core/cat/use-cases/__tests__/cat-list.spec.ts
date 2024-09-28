import { Test } from '@nestjs/testing';

import { CatListUsecase } from '@/core/cat/use-cases/cat-list';
import { ILoggerAdapter, LoggerModule } from '@/infra/logger';
import { ICatListAdapter } from '@/modules/cat/adapter';
import { expectZodError, getMockDate, getMockUUID } from '@/utils/tests';

import { CatEntity } from '../../entity/cat';
import { ICatRepository } from '../../repository/cat';

describe(CatListUsecase.name, () => {
  let usecase: ICatListAdapter;
  let repository: ICatRepository;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [
        {
          provide: ICatRepository,
          useValue: {}
        },
        {
          provide: ICatListAdapter,
          useFactory: (catRepository: ICatRepository) => {
            return new CatListUsecase(catRepository);
          },
          inject: [ICatRepository, ILoggerAdapter]
        }
      ]
    }).compile();

    usecase = app.get(ICatListAdapter);
    repository = app.get(ICatRepository);
  });

  test('when no input is specified, should expect an error', async () => {
    await expectZodError(
      () => usecase.execute({ search: null, sort: null, limit: 10, page: 1 }),
      (issues) => {
        expect(issues).toEqual([{ message: 'Expected object, received null', path: 'sort' }]);
      }
    );
  });

  const cat = new CatEntity({
    id: getMockUUID(),
    age: 10,
    breed: 'dummy',
    name: 'dummy',
    createdAt: getMockDate(),
    updatedAt: getMockDate(),
    deletedAt: null
  });

  const cats = [cat];

  test('when cats are found, should expect an user list', async () => {
    const output = { docs: cats, page: 1, limit: 1, total: 1 };
    repository.paginate = jest.fn().mockResolvedValue(output);

    await expect(usecase.execute({ limit: 1, page: 1, search: {}, sort: { createdAt: -1 } })).resolves.toEqual({
      docs: cats,
      page: 1,
      limit: 1,
      total: 1
    });
  });

  test('when cats not found, should expect an empty list', async () => {
    const output = { docs: [], page: 1, limit: 1, total: 1 };
    repository.paginate = jest.fn().mockResolvedValue(output);

    await expect(usecase.execute({ limit: 1, page: 1, search: {}, sort: { createdAt: -1 } })).resolves.toEqual(output);
  });
});
