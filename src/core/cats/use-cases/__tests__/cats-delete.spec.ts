import { Test } from '@nestjs/testing';

import { CatsDeleteUsecase } from '@/core/cats/use-cases/cats-delete';
import { ILoggerAdapter, LoggerModule } from '@/infra/logger';
import { ICatsDeleteAdapter } from '@/modules/cats/adapter';
import { ApiNotFoundException } from '@/utils/exception';
import { expectZodError, getMockTracing, getMockUUID } from '@/utils/tests';

import { CatsEntity } from '../../entity/cats';
import { ICatsRepository } from '../../repository/cats';

const catMock = {
  id: getMockUUID(),
  age: 10,
  breed: 'dummy',
  name: 'dummy'
} as CatsEntity;

describe('CatsDeleteUsecase', () => {
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

  test('when cats deleted successfully, should expect a cats that has been deleted', async () => {
    repository.findById = jest.fn().mockResolvedValue(catMock);
    repository.updateOne = jest.fn();
    await expect(usecase.execute({ id: getMockUUID() }, getMockTracing())).resolves.toEqual({
      ...catMock,
      deletedAt: expect.any(Date)
    });
  });
});
