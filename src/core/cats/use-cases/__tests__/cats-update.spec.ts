import { Test } from '@nestjs/testing';

import { ILoggerAdapter, LoggerModule } from '@/infra/logger';
import { ICatsUpdateAdapter } from '@/modules/cats/adapter';
import { ApiNotFoundException } from '@/utils/exception';
import { CatsMock } from '@/utils/tests/mocks/cats';
import { RequestMock } from '@/utils/tests/mocks/request';
import { expectZodError, generateUUID } from '@/utils/tests/tests';

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
      () => usecase.execute({}, RequestMock.trancingMock),
      (issues) => {
        expect(issues).toEqual([{ message: 'Required', path: 'id' }]);
      }
    );
  });

  test('should throw error when cats not found', async () => {
    repository.findById = jest.fn().mockResolvedValue(null);
    await expect(usecase.execute({ id: generateUUID() }, RequestMock.trancingMock)).rejects.toThrowError(
      ApiNotFoundException
    );
  });

  test('should update successfully', async () => {
    repository.findById = jest.fn().mockResolvedValue(CatsMock.catResponseMock);
    repository.updateOne = jest.fn().mockResolvedValue(null);
    await expect(usecase.execute({ id: generateUUID() }, RequestMock.trancingMock)).resolves.toEqual(
      CatsMock.catResponseMock
    );
  });
});
