import { ZodMockSchema } from '@mikemajesty/zod-mock-schema';
import { Test } from '@nestjs/testing';

import { ILoggerAdapter, LoggerModule } from '@/infra/logger';
import { ICatGetByIdAdapter } from '@/modules/cat/adapter';
import { ApiNotFoundException } from '@/utils/exception';
import { TestUtils } from '@/utils/test/util';
import { ZodExceptionIssue } from '@/utils/validator';

import { CatEntity, CatEntitySchema } from '../../entity/cat';
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
    await TestUtils.expectZodError(
      () => usecase.execute({} as CatGetByIdInput),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([
          {
            message: 'Invalid input: expected string, received undefined',
            path: TestUtils.nameOf<CatGetByIdInput>('id')
          }
        ]);
      }
    );
  });

  test('when cat not found, should expect an error', async () => {
    repository.findById = TestUtils.mockResolvedValue<CatEntity>(null);

    await expect(usecase.execute({ id: TestUtils.getMockUUID() })).rejects.toThrow(ApiNotFoundException);
  });

  const mock = new ZodMockSchema(CatEntitySchema);
  const input = mock.generate<CatEntity>();

  test('when cat found, should expect a cat found', async () => {
    repository.findById = TestUtils.mockResolvedValue<CatEntity>(input);

    await expect(usecase.execute({ id: TestUtils.getMockUUID() })).resolves.toEqual(input);
  });
});
