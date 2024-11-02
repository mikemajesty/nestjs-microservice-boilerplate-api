import { Test } from '@nestjs/testing';
import { ZodIssue } from 'zod';

import { ILoggerAdapter, LoggerModule } from '@/infra/logger';
import { ICatUpdateAdapter } from '@/modules/cat/adapter';
import { ApiNotFoundException } from '@/utils/exception';
import { TestUtils } from '@/utils/tests';

import { CatEntity } from '../../entity/cat';
import { ICatRepository } from '../../repository/cat';
import { CatUpdateInput, CatUpdateUsecase } from '../cat-update';

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
    await TestUtils.expectZodError(
      () => usecase.execute({} as CatUpdateInput, TestUtils.getMockTracing()),
      (issues: ZodIssue[]) => {
        expect(issues).toEqual([{ message: 'Required', path: CatEntity.nameOf('id') }]);
      }
    );
  });

  test('when cat not found, should expect an error', async () => {
    repository.findById = jest.fn().mockResolvedValue(null);

    await expect(usecase.execute({ id: TestUtils.getMockUUID() }, TestUtils.getMockTracing())).rejects.toThrow(
      ApiNotFoundException
    );
  });

  const cat = new CatEntity({
    id: TestUtils.getMockUUID(),
    age: 10,
    breed: 'dummy',
    name: 'dummy'
  });

  test('when cat updated successfully, should expect a cat that has been updated', async () => {
    repository.findById = jest.fn().mockResolvedValue(cat);
    repository.updateOne = jest.fn().mockResolvedValue(null);

    await expect(usecase.execute({ id: TestUtils.getMockUUID() }, TestUtils.getMockTracing())).resolves.toEqual(cat);
  });
});
