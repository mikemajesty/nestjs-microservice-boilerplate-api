import { Test } from '@nestjs/testing';
import { ZodIssue } from 'zod';

import { LoggerModule } from '@/infra/logger';
import { ICatCreateAdapter } from '@/modules/cat/adapter';
import { ApiInternalServerException } from '@/utils/exception';
import { TestUtils } from '@/utils/tests';

import { CatEntity } from '../../entity/cat';
import { ICatRepository } from '../../repository/cat';
import { CatCreateInput, CatCreateUsecase } from '../cat-create';

describe(CatCreateUsecase.name, () => {
  let usecase: ICatCreateAdapter;
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
          provide: ICatCreateAdapter,
          useFactory: (catRepository: ICatRepository) => {
            return new CatCreateUsecase(catRepository);
          },
          inject: [ICatRepository]
        }
      ]
    }).compile();

    usecase = app.get(ICatCreateAdapter);
    repository = app.get(ICatRepository);
  });

  test('when no input is specified, should expect an error', async () => {
    await TestUtils.expectZodError(
      () => usecase.execute({} as CatCreateInput, TestUtils.getMockTracing()),
      (issues: ZodIssue[]) => {
        expect(issues).toEqual([
          { message: 'Required', path: CatEntity.nameOf('name') },
          { message: 'Required', path: CatEntity.nameOf('breed') },
          { message: 'Required', path: CatEntity.nameOf('age') }
        ]);
      }
    );
  });

  const cat = new CatEntity({
    id: TestUtils.getMockUUID(),
    age: 10,
    breed: 'dummy',
    name: 'dummy'
  });

  test('when cat created successfully, should expect a cat that has been created', async () => {
    repository.create = jest.fn().mockResolvedValue(cat);

    await expect(usecase.execute(cat, TestUtils.getMockTracing())).resolves.toEqual(cat);
  });

  test('when transaction throw an error, should expect an error', async () => {
    repository.create = jest.fn().mockRejectedValue(new ApiInternalServerException());

    await expect(usecase.execute(cat, TestUtils.getMockTracing())).rejects.toThrow(ApiInternalServerException);
  });
});
