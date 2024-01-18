import { Test } from '@nestjs/testing';

import { LoggerModule } from '@/infra/logger';
import { ICatsCreateAdapter } from '@/modules/cats/adapter';
import { ApiInternalServerException } from '@/utils/exception';
import { RequestMock } from '@/utils/tests/mocks/request';
import { expectZodError, getMockUUID } from '@/utils/tests/tests';

import { CatsEntity } from '../../entity/cats';
import { ICatsRepository } from '../../repository/cats';
import { CatsCreateUsecase } from '../cats-create';

const catCreateMock = new CatsEntity({
  id: getMockUUID(),
  age: 10,
  breed: 'dummy',
  name: 'dummy'
});

describe('CatsCreateUsecase', () => {
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
      () => usecase.execute({}, RequestMock.trancingMock),
      (issues) => {
        expect(issues).toEqual([
          { message: 'Required', path: CatsEntity.nameOf('name') },
          { message: 'Required', path: CatsEntity.nameOf('breed') },
          { message: 'Required', path: CatsEntity.nameOf('age') }
        ]);
      }
    );
  });

  test('when cats created successfully, should expect a cats that has been created', async () => {
    repository.create = jest.fn().mockResolvedValue(catCreateMock);
    repository.startSession = jest.fn().mockResolvedValue({
      commit: jest.fn(),
      rollback: jest.fn()
    });
    await expect(usecase.execute(catCreateMock, RequestMock.trancingMock)).resolves.toEqual(catCreateMock);
  });

  test('when transaction throw an error, should expect an error', async () => {
    repository.startSession = jest.fn().mockResolvedValue({
      commit: jest.fn(),
      rollback: jest.fn()
    });
    repository.create = jest.fn().mockRejectedValue(new ApiInternalServerException());
    await expect(usecase.execute(catCreateMock, RequestMock.trancingMock)).rejects.toThrow(ApiInternalServerException);
  });
});
