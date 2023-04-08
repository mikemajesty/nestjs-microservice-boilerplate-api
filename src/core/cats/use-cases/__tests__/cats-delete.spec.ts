import { Test } from '@nestjs/testing';

import { CatsDeleteUsecase } from '@/core/cats/use-cases/cats-delete';
import { ILoggerAdapter, LoggerModule } from '@/infra/logger';
import { ICatsDeleteAdapter } from '@/modules/cats/adapter';
import { ApiNotFoundException } from '@/utils/exception';
import { expectZodError, generateUUID } from '@/utils/tests';

import { ICatsRepository } from '../../repository/cats';
import { CatsEntity } from './../../entity/cats';

const catResponse = {
  id: generateUUID(),
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

  test('should throw error when invalid parameters', async () => {
    await expectZodError(
      () => usecase.execute({}),
      (issues) => {
        expect(issues).toEqual([{ message: 'Required', path: 'id' }]);
      }
    );
  });

  test('should throw error when cats not found', async () => {
    repository.findById = jest.fn().mockResolvedValue(null);
    await expect(usecase.execute({ id: generateUUID() })).rejects.toThrowError(ApiNotFoundException);
  });

  test('should delete successfully', async () => {
    repository.findById = jest.fn().mockResolvedValue(catResponse);
    repository.updateOne = jest.fn();
    await expect(usecase.execute({ id: generateUUID() })).resolves.toEqual({
      ...catResponse,
      deletedAt: expect.any(Date)
    });
  });
});
