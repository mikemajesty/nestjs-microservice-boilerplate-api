import { Test } from '@nestjs/testing';
import { TestMock } from 'test/mock';
import { ZodIssue } from 'zod';

import { ILoggerAdapter, LoggerModule } from '@/infra/logger';
import { ICatGetByIdAdapter } from '@/modules/cat/adapter';
import { ApiNotFoundException } from '@/utils/exception';

import { CatEntity } from '../../entity/cat';
import { ICatRepository } from '../../repository/cat';
import { CatGetByIdInput, CatGetByIdUsecase } from '../cat-get-by-id';

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
    await TestMock.expectZodError(
      () => usecase.execute({} as CatGetByIdInput),
      (issues: ZodIssue[]) => {
        expect(issues).toEqual([{ message: 'Required', path: TestMock.nameOf<CatGetByIdInput>('id') }]);
      }
    );
  });

  test('when cat not found, should expect an error', async () => {
    repository.findById = TestMock.mockResolvedValue<CatEntity>(null);

    await expect(usecase.execute({ id: TestMock.getMockUUID() })).rejects.toThrow(ApiNotFoundException);
  });

  const cat = new CatEntity({
    id: TestMock.getMockUUID(),
    name: 'Miau',
    breed: 'dummy',
    age: 10
  });

  test('when cat found, should expect a cat found', async () => {
    repository.findById = TestMock.mockResolvedValue<CatEntity>(cat);

    await expect(usecase.execute({ id: TestMock.getMockUUID() })).resolves.toEqual(cat);
  });
});
