import { Test } from '@nestjs/testing';
import { TestMock } from 'test/mock';
import { ZodIssue } from 'zod';

import { CreatedModel } from '@/infra/repository';
import { ICatCreateAdapter } from '@/modules/cat/adapter';
import { ApiInternalServerException } from '@/utils/exception';

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
    await TestMock.expectZodError(
      () => usecase.execute({} as CatCreateInput, TestMock.getMockTracing()),
      (issues: ZodIssue[]) => {
        expect(issues).toEqual([
          { message: 'Required', path: TestMock.nameOf<CatCreateInput>('name') },
          { message: 'Required', path: TestMock.nameOf<CatCreateInput>('breed') },
          { message: 'Required', path: TestMock.nameOf<CatCreateInput>('age') }
        ]);
      }
    );
  });

  const input = new CatEntity({
    id: TestMock.getMockUUID(),
    age: 10,
    breed: 'dummy',
    name: 'dummy'
  });

  test('when cat created successfully, should expect a cat created', async () => {
    repository.create = TestMock.mockResolvedValue<CreatedModel>(input);

    await expect(usecase.execute(input, TestMock.getMockTracing())).resolves.toEqual(input);
  });

  test('when transaction throw an error, should expect an error', async () => {
    repository.create = TestMock.mockRejectedValue(new ApiInternalServerException());

    await expect(usecase.execute(input, TestMock.getMockTracing())).rejects.toThrow(ApiInternalServerException);
  });
});
