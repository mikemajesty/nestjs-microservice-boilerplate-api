import { Test } from '@nestjs/testing';
import { TestMock } from 'test/mock';

import { ILoggerAdapter, LoggerModule } from '@/infra/logger';
import { UpdatedModel } from '@/infra/repository';
import { ICatUpdateAdapter } from '@/modules/cat/adapter';
import { ApiNotFoundException } from '@/utils/exception';
import { ZodExceptionIssue } from '@/utils/validator';

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
    await TestMock.expectZodError(
      () => usecase.execute({} as CatUpdateInput, TestMock.getMockTracing()),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([{ message: 'Required', path: TestMock.nameOf<CatUpdateInput>('id') }]);
      }
    );
  });

  test('when cat not found, should expect an error', async () => {
    repository.findById = TestMock.mockResolvedValue<CatEntity>(null);

    await expect(usecase.execute({ id: TestMock.getMockUUID() }, TestMock.getMockTracing())).rejects.toThrow(
      ApiNotFoundException
    );
  });

  const cat = new CatEntity({
    id: TestMock.getMockUUID(),
    age: 10,
    breed: 'dummy',
    name: 'dummy'
  });

  test('when cat updated successfully, should expect a cat updated', async () => {
    repository.findById = TestMock.mockResolvedValue<CatEntity>(cat);
    repository.updateOne = TestMock.mockResolvedValue<UpdatedModel>();

    await expect(usecase.execute({ id: TestMock.getMockUUID() }, TestMock.getMockTracing())).resolves.toEqual(cat);
  });
});
