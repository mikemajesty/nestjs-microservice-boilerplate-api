import { Test } from '@nestjs/testing';

import { ILoggerAdapter, LoggerModule } from '@/infra/logger';
import { ICatsGetByIdAdapter } from '@/modules/cats/adapter';
import { ApiNotFoundException } from '@/utils/exception';
import { expectZodError, getMockUUID } from '@/utils/tests';

import { CatsEntity } from '../../entity/cats';
import { ICatsRepository } from '../../repository/cats';
import { CatsGetByIdUsecase } from '../cats-get-by-id';

const catMock = {
  id: getMockUUID(),
  age: 10,
  breed: 'dummy',
  name: 'dummy'
} as CatsEntity;

describe('CatsGetByIdUsecase', () => {
  let usecase: ICatsGetByIdAdapter;
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
          provide: ICatsGetByIdAdapter,
          useFactory: (catsRepository: ICatsRepository) => {
            return new CatsGetByIdUsecase(catsRepository);
          },
          inject: [ICatsRepository, ILoggerAdapter]
        }
      ]
    }).compile();

    usecase = app.get(ICatsGetByIdAdapter);
    repository = app.get(ICatsRepository);
  });

  test('when no input is specified, should expect an error', async () => {
    await expectZodError(
      () => usecase.execute({}),
      (issues) => {
        expect(issues).toEqual([{ message: 'Required', path: CatsEntity.nameOf('id') }]);
      }
    );
  });

  test('when cats not found, should expect an error', async () => {
    repository.findById = jest.fn().mockResolvedValue(null);
    await expect(usecase.execute({ id: getMockUUID() })).rejects.toThrow(ApiNotFoundException);
  });

  test('when cats found, should expect a cats that has been found', async () => {
    repository.findById = jest.fn().mockResolvedValue(catMock);
    await expect(usecase.execute({ id: getMockUUID() })).resolves.toEqual(catMock);
  });
});
