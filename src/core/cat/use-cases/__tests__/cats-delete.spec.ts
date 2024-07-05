import { Test } from '@nestjs/testing';

import { CatsDeleteUsecase } from '@/core/cat/use-cases/cats-delete';
import { ILoggerAdapter, LoggerModule } from '@/infra/logger';
import { ICatsDeleteAdapter } from '@/modules/cat/adapter';
import { ApiNotFoundException } from '@/utils/exception';
import { expectZodError, getMockTracing, getMockUUID } from '@/utils/tests';

import { CatsEntity } from '../../entity/cats';
import { ICatsRepository } from '../../repository/cats';

describe(CatsDeleteUsecase.name, () => {
  let usecase: ICatsDeleteAdapter;
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
          provide: ICatsDeleteAdapter,
          useFactory: (catsRepository: ICatsRepository) => {
            return new CatsDeleteUsecase(catsRepository);
          },
          inject: [ICatsRepository, ILoggerAdapter]
        }
      ]
    }).compile();

    usecase = app.get(ICatsDeleteAdapter);
    repository = app.get(ICatsRepository);
  });

  test('when no input is specified, should expect an error', async () => {
    await expectZodError(
      () => usecase.execute({}, getMockTracing()),
      (issues) => {
        expect(issues).toEqual([{ message: 'Required', path: CatsEntity.nameOf('id') }]);
      }
    );
  });

  test('when cats not found, should expect an error', async () => {
    repository.findById = jest.fn().mockResolvedValue(null);

    await expect(usecase.execute({ id: getMockUUID() }, getMockTracing())).rejects.toThrow(ApiNotFoundException);
  });

  const cat = new CatsEntity({
    id: getMockUUID(),
    age: 10,
    breed: 'dummy',
    name: 'dummy'
  });

  test('when cats deleted successfully, should expect a cats that has been deleted', async () => {
    repository.findById = jest.fn().mockResolvedValue(cat);
    repository.updateOne = jest.fn();

    await expect(usecase.execute({ id: getMockUUID() }, getMockTracing())).resolves.toEqual({
      ...cat,
      deletedAt: expect.any(Date)
    });
  });
});
