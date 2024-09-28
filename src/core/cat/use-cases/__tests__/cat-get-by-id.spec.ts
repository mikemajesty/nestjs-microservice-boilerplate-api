import { Test } from '@nestjs/testing';

import { ILoggerAdapter, LoggerModule } from '@/infra/logger';
import { ICatGetByIdAdapter } from '@/modules/cat/adapter';
import { ApiNotFoundException } from '@/utils/exception';
import { expectZodError, getMockUUID } from '@/utils/tests';

import { CatEntity } from '../../entity/cat';
import { ICatRepository } from '../../repository/cat';
import { CatGetByIdUsecase } from '../cat-get-by-id';

describe(CatGetByIdUsecase.name, () => {
  let usecase: ICatGetByIdAdapter;
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
          provide: ICatGetByIdAdapter,
          useFactory: (catRepository: ICatRepository) => {
            return new CatGetByIdUsecase(catRepository);
          },
          inject: [ICatRepository, ILoggerAdapter]
        }
      ]
    }).compile();

    usecase = app.get(ICatGetByIdAdapter);
    repository = app.get(ICatRepository);
  });

  test('when no input is specified, should expect an error', async () => {
    await expectZodError(
      () => usecase.execute({}),
      (issues) => {
        expect(issues).toEqual([{ message: 'Required', path: CatEntity.nameOf('id') }]);
      }
    );
  });

  test('when cat not found, should expect an error', async () => {
    repository.findById = jest.fn().mockResolvedValue(null);

    await expect(usecase.execute({ id: getMockUUID() })).rejects.toThrow(ApiNotFoundException);
  });

  const cat = new CatEntity({
    id: getMockUUID(),
    name: 'Miau',
    breed: 'dummy',
    age: 10
  });

  test('when cat found, should expect a cat that has been found', async () => {
    repository.findById = jest.fn().mockResolvedValue(cat);

    await expect(usecase.execute({ id: getMockUUID() })).resolves.toEqual(cat);
  });
});
