import { Test } from '@nestjs/testing';

import { ILoggerAdapter, LoggerModule } from '@/infra/logger';
import { ICatsUpdateAdapter } from '@/modules/cats/adapter';
import { ApiNotFoundException } from '@/utils/exception';
import { expectZodError, getMockTracing, getMockUUID } from '@/utils/tests';

import { CatsEntity } from '../../entity/cats';
import { ICatsRepository } from '../../repository/cats';
import { CatsUpdateUsecase } from '../cats-update';

const catMock = {
  id: getMockUUID(),
  age: 10,
  breed: 'dummy',
  name: 'dummy'
} as CatsEntity;

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

  test('when cats updated successfully, should expect a cats that has been updated', async () => {
    repository.findById = jest.fn().mockResolvedValue(catMock);
    repository.updateOne = jest.fn().mockResolvedValue(null);
    await expect(usecase.execute({ id: getMockUUID() }, getMockTracing())).resolves.toEqual(catMock);
  });
});
