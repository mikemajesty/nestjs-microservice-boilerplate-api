import { Test } from '@nestjs/testing';

import { ILoggerAdapter, LoggerModule } from '@/infra/logger';
import { ICatsGetByIDAdapter } from '@/modules/cats/adapter';
import { ApiNotFoundException } from '@/utils/exception';
import { CatsResponseMock } from '@/utils/tests/mocks/cats';
import { expectZodError, generateUUID } from '@/utils/tests/tests';

import { CatsEntity } from '../../entity/cats';
import { ICatsRepository } from '../../repository/cats';
import { CatsGetByIdUsecase } from '../cats-getByID';

describe('CatsGetByIdUsecase', () => {
  let usecase: ICatsGetByIDAdapter;
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
          provide: ICatsGetByIDAdapter,
          useFactory: (catsRepository: ICatsRepository) => {
            return new CatsGetByIdUsecase(catsRepository);
          },
          inject: [ICatsRepository, ILoggerAdapter]
        }
      ]
    }).compile();

    usecase = app.get(ICatsGetByIDAdapter);
    repository = app.get(ICatsRepository);
  });

  test('when no input is specified, should expect an error', async () => {
    await expectZodError(
      () => usecase.execute({}),
      (issues) => {
        expect(issues).toEqual([{ message: 'Required', path: CatsEntity.nameof('id') }]);
      }
    );
  });

  test('when cats not found, should expect an error', async () => {
    repository.findById = jest.fn().mockResolvedValue(null);
    await expect(usecase.execute({ id: generateUUID() })).rejects.toThrowError(ApiNotFoundException);
  });

  test('when cats found, should expect a cats that has been found.', async () => {
    repository.findById = jest.fn().mockResolvedValue(CatsResponseMock.catMock);
    await expect(usecase.execute({ id: generateUUID() })).resolves.toEqual(CatsResponseMock.catMock);
  });
});
