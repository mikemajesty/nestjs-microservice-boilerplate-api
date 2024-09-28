import { Test } from '@nestjs/testing';

import { ILoggerAdapter, LoggerModule } from '@/infra/logger';
import { ICatUpdateAdapter } from '@/modules/cat/adapter';
import { ApiNotFoundException } from '@/utils/exception';
import { expectZodError, getMockTracing, getMockUUID } from '@/utils/tests';

import { CatEntity } from '../../entity/cat';
import { ICatRepository } from '../../repository/cat';
import { CatUpdateUsecase } from '../cat-update';

describe(CatUpdateUsecase.name, () => {
  let usecase: ICatUpdateAdapter;
  let repository: ICatRepository;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [
        {
          provide: ICatRepository,
          useValue: {}
        },
        {
          provide: ICatUpdateAdapter,
          useFactory: (catRepository: ICatRepository, logger: ILoggerAdapter) => {
            return new CatUpdateUsecase(catRepository, logger);
          },
          inject: [ICatRepository, ILoggerAdapter]
        }
      ]
    }).compile();

    usecase = app.get(ICatUpdateAdapter);
    repository = app.get(ICatRepository);
  });

  test('when no input is specified, should expect an error', async () => {
    await expectZodError(
      () => usecase.execute({}, getMockTracing()),
      (issues) => {
        expect(issues).toEqual([{ message: 'Required', path: CatEntity.nameOf('id') }]);
      }
    );
  });

  test('when cat not found, should expect an error', async () => {
    repository.findById = jest.fn().mockResolvedValue(null);

    await expect(usecase.execute({ id: getMockUUID() }, getMockTracing())).rejects.toThrow(ApiNotFoundException);
  });

  const cat = new CatEntity({
    id: getMockUUID(),
    age: 10,
    breed: 'dummy',
    name: 'dummy'
  });

  test('when cat updated successfully, should expect a cat that has been updated', async () => {
    repository.findById = jest.fn().mockResolvedValue(cat);
    repository.updateOne = jest.fn().mockResolvedValue(null);

    await expect(usecase.execute({ id: getMockUUID() }, getMockTracing())).resolves.toEqual(cat);
  });
});
