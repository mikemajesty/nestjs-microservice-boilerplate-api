import { Test } from '@nestjs/testing';

import { ILoggerAdapter, LoggerModule } from '@/infra/logger';
import { ICatsUpdateAdapter } from '@/modules/cats/adapter';
import { ApiNotFoundException } from '@/utils/exception';
import { expectZodError, generateUUID } from '@/utils/tests';

import { ICatsRepository } from '../../repository/cats';
import { CatsUpdateUsecase } from '../cats-update';
import { CatsEntity } from './../../entity/cats';

const catResponse = {
  id: generateUUID(),
  age: 10,
  breed: 'dummy',
  name: 'dummy'
} as CatsEntity;

describe('CatsUpdateUsecase', () => {
  let usecase: ICatsUpdateAdapter;
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
          provide: ICatsUpdateAdapter,
          useFactory: (userRepository: ICatsRepository, logger: ILoggerAdapter) => {
            return new CatsUpdateUsecase(userRepository, logger);
          },
          inject: [ICatsRepository, ILoggerAdapter]
        }
      ]
    }).compile();

    usecase = app.get(ICatsUpdateAdapter);
    repository = app.get(ICatsRepository);
  });

  test('should throw error when invalid parameters', async () => {
    await expectZodError(
      () => usecase.execute({}),
      (issues) => {
        expect(issues).toEqual([{ message: 'Required', path: 'id' }]);
      }
    );
  });

  test('should throw error when user not found', async () => {
    repository.findById = jest.fn().mockResolvedValue(null);
    await expect(usecase.execute({ id: generateUUID() })).rejects.toThrowError(ApiNotFoundException);
  });

  test('should update successfully', async () => {
    repository.findById = jest.fn().mockResolvedValue(catResponse);
    repository.updateOne = jest.fn().mockResolvedValue(null);
    await expect(usecase.execute({ id: generateUUID() })).resolves.toEqual(catResponse);
  });
});
