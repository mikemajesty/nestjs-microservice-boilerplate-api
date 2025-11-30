import { Test } from '@nestjs/testing';

import { CreatedModel } from '@/infra/repository';
import { ICatCreateAdapter } from '@/modules/cat/adapter';
import { ApiInternalServerException } from '@/utils/exception';
import { TestUtils } from '@/utils/test/util';
import { ZodExceptionIssue } from '@/utils/validator';

// import { EntityMock } from '@/test/mock';
import { CatEntity } from '../../entity/cat';
import { ICatRepository } from '../../repository/cat';
import { CatCreateInput, CatCreateUsecase } from '../cat-create';

describe(CatCreateUsecase.name, () => {
  let usecase: ICatCreateAdapter;
  let repository: ICatRepository;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      imports: [],
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
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([
          { message: 'Required', path: TestUtils.nameOf<CatCreateInput>('name') },
          { message: 'Required', path: TestUtils.nameOf<CatCreateInput>('breed') },
          { message: 'Required', path: TestUtils.nameOf<CatCreateInput>('age') }
        ]);
      }
    );
  });

  const input = new CatEntity({
    id: TestUtils.getMockUUID(),
    age: 10,
    breed: 'dummy',
    name: 'dummy'
  });

  test('when cat created successfully, should expect a cat created', async () => {
    repository.create = TestUtils.mockResolvedValue<CreatedModel>(input);

    // const entity = new EntityMock(CatEntitySchema);
    // console.log('entity', entity);
    await expect(usecase.execute(input, TestUtils.getMockTracing())).resolves.toEqual(input);
  });

  test('when transaction throw an error, should expect an error', async () => {
    repository.create = TestUtils.mockRejectedValue(new ApiInternalServerException());

    await expect(usecase.execute(input, TestUtils.getMockTracing())).rejects.toThrow(ApiInternalServerException);
  });
});
