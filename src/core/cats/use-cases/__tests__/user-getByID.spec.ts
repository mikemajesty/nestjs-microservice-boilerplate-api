import { Test } from '@nestjs/testing';

import { ILoggerAdapter, LoggerModule } from '@/infra/logger';
import { ICatsGetByIDAdapter } from '@/modules/cats/adapter';
import { ApiNotFoundException } from '@/utils/exception';
import { expectZodError, generateUUID } from '@/utils/tests';

import { ICatsRepository } from '../../repository/cats';
import { CatsGetByIdUsecase } from '../cats-getByID';
import { CatsEntity } from './../../entity/cats';

const catResponse = {
  id: generateUUID(),
  age: 10,
  breed: 'dummy',
  name: 'dummy'
} as CatsEntity;

describe('CatsGetByIdUsecase', () => {
  let usecase: ICatsGetByIDAdapter;
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
          provide: ICatsGetByIDAdapter,
          useFactory: (userRepository: ICatsRepository) => {
            return new CatsGetByIdUsecase(userRepository);
          },
          inject: [ICatsRepository, ILoggerAdapter]
        }
      ]
    }).compile();

    usecase = app.get(ICatsGetByIDAdapter);
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

  test('should getById successfully', async () => {
    repository.findById = jest.fn().mockResolvedValue(catResponse);
    await expect(usecase.execute({ id: generateUUID() })).resolves.toEqual(catResponse);
  });
});
