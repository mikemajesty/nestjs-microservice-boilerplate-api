import { Test } from '@nestjs/testing';

import { LoggerModule } from '@/infra/logger';
import { ICatsCreateAdapter } from '@/modules/cat/adapter';
import { ApiInternalServerException } from '@/utils/exception';
import { expectZodError, getMockTracing, getMockUUID } from '@/utils/tests';

import { CatsEntity } from '../../entity/cats';
import { ICatsRepository } from '../../repository/cats';
import { CatsCreateUsecase } from '../cats-create';

describe(CatsCreateUsecase.name, () => {
  let usecase: ICatsCreateAdapter;
  let repository: ICatsRepository;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [
        {
          provide: ICatsRepository,
          useValue: {}
        },
        {
          provide: ICatsCreateAdapter,
          useFactory: (catsRepository: ICatsRepository) => {
            return new CatsCreateUsecase(catsRepository);
          },
          inject: [ICatsRepository]
        }
      ]
    }).compile();

    usecase = app.get(ICatsCreateAdapter);
    repository = app.get(ICatsRepository);
  });

  test('when no input is specified, should expect an error', async () => {
    await expectZodError(
      () => usecase.execute({}, getMockTracing()),
      (issues) => {
        expect(issues).toEqual([
          { message: 'Required', path: CatsEntity.nameOf('name') },
          { message: 'Required', path: CatsEntity.nameOf('breed') },
          { message: 'Required', path: CatsEntity.nameOf('age') }
        ]);
      }
    );
  });

  const cat = new CatsEntity({
    id: getMockUUID(),
    age: 10,
    breed: 'dummy',
    name: 'dummy'
  });

  test('when cats created successfully, should expect a cats that has been created', async () => {
    repository.create = jest.fn().mockResolvedValue(cat);

    await expect(usecase.execute(cat, getMockTracing())).resolves.toEqual(cat);
  });

  test('when transaction throw an error, should expect an error', async () => {
    repository.create = jest.fn().mockRejectedValue(new ApiInternalServerException());

    await expect(usecase.execute(cat, getMockTracing())).rejects.toThrow(ApiInternalServerException);
  });
});
