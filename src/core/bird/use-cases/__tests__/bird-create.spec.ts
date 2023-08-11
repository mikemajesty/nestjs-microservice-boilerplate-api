import { Test } from '@nestjs/testing';

import { ILoggerAdapter } from '@/infra/logger';
import { IBirdCreateAdapter } from '@/modules/bird/adapter';
import { ApiInternalServerException } from '@/utils/exception';
import { expectZodError } from '@/utils/tests';

import { IBirdRepository } from '../../repository/bird';
import { BirdCreateInput, BirdCreateUsecase } from '../bird-create';

const bird = {
  name: 'dummy'
} as BirdCreateInput;

describe('BirdCreateUsecase', () => {
  let usecase: IBirdCreateAdapter;
  let repository: IBirdRepository;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      providers: [
        {
          provide: IBirdRepository,
          useValue: {}
        },
        {
          provide: ILoggerAdapter,
          useValue: {
            info: jest.fn()
          }
        },
        {
          provide: IBirdCreateAdapter,
          useFactory: (birdRepository: IBirdRepository, logger: ILoggerAdapter) => {
            return new BirdCreateUsecase(birdRepository, logger);
          },
          inject: [IBirdRepository, ILoggerAdapter]
        }
      ]
    }).compile();

    usecase = app.get(IBirdCreateAdapter);
    repository = app.get(IBirdRepository);
  });

  test('should throw error when invalid parameters', async () => {
    await expectZodError(
      () => usecase.execute({}),
      (issues) => {
        expect(issues).toEqual([{ message: 'Required', path: 'name' }]);
      }
    );
  });

  test('should create successfully', async () => {
    repository.findOne = jest.fn().mockResolvedValue(null);
    repository.create = jest.fn().mockResolvedValue(bird);
    repository.startSession = jest.fn().mockResolvedValue({
      commitTransaction: jest.fn()
    });
    await expect(usecase.execute(bird)).resolves.toEqual(bird);
  });

  test('should throw error when create exception', async () => {
    repository.findOne = jest.fn().mockResolvedValue(null);
    repository.create = jest.fn().mockRejectedValue(new ApiInternalServerException('error'));
    repository.startSession = jest.fn().mockResolvedValue({
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn()
    });
    await expect(usecase.execute(bird)).rejects.toThrow(ApiInternalServerException);
  });
});
