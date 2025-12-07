import { ZodMockSchema } from '@mikemajesty/zod-mock-schema';
import { Test } from '@nestjs/testing';

import { CatListInput, CatListOutput, CatListUsecase } from '@/core/cat/use-cases/cat-list';
import { ILoggerAdapter, LoggerModule } from '@/infra/logger';
import { ICatListAdapter } from '@/modules/cat/adapter';
import { TestUtils } from '@/utils/test/util';
import { ZodExceptionIssue } from '@/utils/validator';

import { CatEntity, CatEntitySchema } from '../../entity/cat';
import { ICatRepository } from '../../repository/cat';

describe(CatListUsecase.name, () => {
  let usecase: ICatListAdapter;
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
          provide: ICatListAdapter,
          useFactory: (catRepository: ICatRepository) => {
            return new CatListUsecase(catRepository);
          },
          inject: [ICatRepository, ILoggerAdapter]
        }
      ]
    }).compile();

    usecase = app.get(ICatListAdapter);
    repository = app.get(ICatRepository);
  });

  test('when no input is specified, should expect an error', async () => {
    await TestUtils.expectZodError(
      () => usecase.execute({} as CatListInput),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([
          {
            message: 'Invalid input: expected string, received undefined',
            path: TestUtils.nameOf<CatListInput>('search')
          }
        ]);
      }
    );
  });

  const mock = new ZodMockSchema(CatEntitySchema);
  const docs = mock.generateMany(2, {
    overrides: {
      deletedAt: null
    }
  });

  test('when cats are found, should expect an user list', async () => {
    const output = { docs: docs as CatEntity[], page: 1, limit: 1, total: 1 };
    repository.paginate = TestUtils.mockResolvedValue<CatListOutput>(output);

    await expect(usecase.execute({ limit: 1, page: 1, search: {}, sort: { createdAt: -1 } })).resolves.toEqual({
      docs: output.docs,
      page: 1,
      limit: 1,
      total: 1
    });
  });

  test('when cats not found, should expect an empty list', async () => {
    const output = { docs: docs as CatEntity[], page: 1, limit: 1, total: 1 };
    repository.paginate = TestUtils.mockResolvedValue<CatListOutput>(output);

    await expect(usecase.execute({ limit: 1, page: 1, search: {}, sort: { createdAt: -1 } })).resolves.toEqual(output);
  });
});
