import { Test } from '@nestjs/testing';

import { CatsDeleteUsecase } from '@/core/cats/use-cases/cats-delete';
import { ILoggerAdapter, LoggerModule } from '@/infra/logger';
import { ICatsDeleteAdapter } from '@/modules/cats/adapter';
import { ApiNotFoundException } from '@/utils/exception';
import { CatsResponseMock } from '@/utils/tests/mocks/cats';
import { RequestMock } from '@/utils/tests/mocks/request';
import { expectZodError, generateUUID } from '@/utils/tests/tests';

import { CatsEntity } from '../../entity/cats';
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

  test('when no input is specified, should expect an error', async () => {
    await expectZodError(
      () => usecase.execute({}, RequestMock.trancingMock),
      (issues) => {
        expect(issues).toEqual([{ message: 'Required', path: CatsEntity.nameof('id') }]);
      }
    );
  });

  test('when cats not found, should expect an error', async () => {
    repository.findById = jest.fn().mockResolvedValue(null);
    await expect(usecase.execute({ id: generateUUID() }, RequestMock.trancingMock)).rejects.toThrowError(
      ApiNotFoundException
    );
  });

  test('when cats deleted successfully, should expec a cats that has been deleted', async () => {
    repository.findById = jest.fn().mockResolvedValue(CatsResponseMock.catMock);
    repository.updateOne = jest.fn();
    await expect(usecase.execute({ id: generateUUID() }, RequestMock.trancingMock)).resolves.toEqual({
      ...CatsResponseMock.catMock,
      deletedAt: expect.any(Date)
    });
  });
});
