import { Test } from '@nestjs/testing';

import { CatsDeleteUsecase } from '@/core/cats/use-cases/cats-delete';
import { ILoggerAdapter, LoggerModule } from '@/infra/logger';
import { ICatsDeleteAdapter } from '@/modules/cats/adapter';
import { ApiNotFoundException } from '@/utils/exception';
import { catResponseMock } from '@/utils/mocks/cats';
import { expectZodError, generateUUID, trancingMock } from '@/utils/tests';

import { ICatsRepository } from '../../repository/cats';

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
      () => usecase.execute({}, trancingMock),
      (issues) => {
        expect(issues).toEqual([{ message: 'Required', path: 'id' }]);
      }
    );
  });

  test('should throw error when cats not found', async () => {
    repository.findById = jest.fn().mockResolvedValue(null);
    await expect(usecase.execute({ id: generateUUID() }, trancingMock)).rejects.toThrowError(ApiNotFoundException);
  });

  test('should delete successfully', async () => {
    repository.findById = jest.fn().mockResolvedValue(catResponseMock);
    repository.updateOne = jest.fn();
    await expect(usecase.execute({ id: generateUUID() }, trancingMock)).resolves.toEqual({
      ...catResponseMock,
      deletedAt: expect.any(Date)
    });
  });
});
