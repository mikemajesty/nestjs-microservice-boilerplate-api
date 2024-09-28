import { Test } from '@nestjs/testing';

import { CatDeleteUsecase } from '@/core/cat/use-cases/cat-delete';
import { ILoggerAdapter, LoggerModule } from '@/infra/logger';
import { ICatDeleteAdapter } from '@/modules/cat/adapter';
import { ApiNotFoundException } from '@/utils/exception';
import { expectZodError, getMockTracing, getMockUUID } from '@/utils/tests';

import { CatEntity } from '../../entity/cat';
import { ICatRepository } from '../../repository/cat';

describe(CatDeleteUsecase.name, () => {
  let usecase: ICatDeleteAdapter;
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
          provide: ICatDeleteAdapter,
          useFactory: (catRepository: ICatRepository) => {
            return new CatDeleteUsecase(catRepository);
          },
          inject: [ICatRepository, ILoggerAdapter]
        }
      ]
    }).compile();

    usecase = app.get(ICatDeleteAdapter);
    repository = app.get(ICatRepository);
  });

  test('when no input is specified, should expect an error', async () => {
    await expectZodError(
      () => usecase.execute({}, getMockTracing()),
      (issues) => {
        expect(issues).toEqual([{ message: 'Required', path: CatEntity.nameOf('id') }]);
      }
    );
  });

  test('when cat not found, should expect an error', async () => {
    repository.findById = jest.fn().mockResolvedValue(null);

    await expect(usecase.execute({ id: getMockUUID() }, getMockTracing())).rejects.toThrow(ApiNotFoundException);
  });

  const cat = new CatEntity({
    id: getMockUUID(),
    age: 10,
    breed: 'dummy',
    name: 'dummy'
  });

  test('when cat deleted successfully, should expect a cat that has been deleted', async () => {
    repository.findById = jest.fn().mockResolvedValue(cat);
    repository.updateOne = jest.fn();

    await expect(usecase.execute({ id: getMockUUID() }, getMockTracing())).resolves.toEqual({
      ...cat,
      deletedAt: expect.any(Date)
    });
  });
});
