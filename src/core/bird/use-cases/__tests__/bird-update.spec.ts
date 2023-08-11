import { Test } from '@nestjs/testing';

import { ILoggerAdapter, LoggerModule } from '@/infra/logger';
import { IBirdUpdateAdapter } from '@/modules/bird/adapter';
import { ApiNotFoundException } from '@/utils/exception';
import { expectZodError, generateUUID } from '@/utils/tests';

import { BirdEntity } from '../../entity/bird';
import { IBirdRepository } from '../../repository/bird';
import { BirdUpdateInput } from '../bird-update';
import { BirdUpdateUsecase } from '../bird-update';

const birdBody = {
  id: generateUUID(),
  name: 'dummy'
} as BirdUpdateInput;

const birdResponse = {
  id: generateUUID(),
  name: 'dummy'
} as BirdEntity;

describe('BirdUpdateUsecase', () => {
  let usecase: IBirdUpdateAdapter;
  let repository: IBirdRepository;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [
        {
          provide: IBirdRepository,
          useValue: {}
        },
        {
          provide: IBirdUpdateAdapter,
          useFactory: (birdRepository: IBirdRepository, logger: ILoggerAdapter) => {
            return new BirdUpdateUsecase(birdRepository, logger);
          },
          inject: [IBirdRepository, ILoggerAdapter]
        }
      ]
    }).compile();

    usecase = app.get(IBirdUpdateAdapter);
    repository = app.get(IBirdRepository);
  });

  test('should throw error when invalid parameters', async () => {
    await expectZodError(
      () => usecase.execute({}),
      (issues) => {
        expect(issues).toEqual([{ message: 'Required', path: 'id' }]);
      }
    );
  });

  test('should update successfully', async () => {
    repository.findById = jest.fn().mockResolvedValue(birdResponse);
    repository.updateOne = jest.fn().mockResolvedValue(null);
    await expect(usecase.execute(birdBody)).resolves.toEqual(birdResponse);
  });

  test('should throw error when bird not found', async () => {
    repository.findById = jest.fn().mockResolvedValue(null);
    await expect(usecase.execute(birdBody)).rejects.toThrowError(ApiNotFoundException);
  });
});
