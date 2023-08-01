import { Test } from '@nestjs/testing';

import { ILoggerAdapter, LoggerModule } from '@/infra/logger';
import { ICatsUpdateAdapter } from '@/modules/cats/adapter';
import { ApiNotFoundException } from '@/utils/exception';
import { catResponseMock } from '@/utils/mocks/cats';
import { expectZodError, generateUUID } from '@/utils/tests';

import { ICatsRepository } from '../../repository/cats';
import { CatsUpdateUsecase } from '../cats-update';

describe('CatsUpdateUsecase', () => {
  let usecase: ICatsUpdateAdapter;
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
          provide: ICatsUpdateAdapter,
          useFactory: (catsRepository: ICatsRepository, logger: ILoggerAdapter) => {
            return new CatsUpdateUsecase(catsRepository, logger);
          },
          inject: [ICatsRepository, ILoggerAdapter]
        }
      ]
    }).compile();

    usecase = app.get(ICatsUpdateAdapter);
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

  test('should update successfully', async () => {
    repository.findById = jest.fn().mockResolvedValue(catResponseMock);
    repository.updateOne = jest.fn().mockResolvedValue(null);
    await expect(usecase.execute({ id: generateUUID() })).resolves.toEqual(catResponseMock);
  });
});
