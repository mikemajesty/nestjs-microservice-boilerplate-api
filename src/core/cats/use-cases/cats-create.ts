import { ILoggerAdapter } from '@/infra/logger';
import { CatsCreateInput, CatsCreateOutput } from '@/modules/cats/types';

import { ICatsRepository } from '../repository/cats';
import { CatsEntity } from './../entity/cats';

export class CatsCreateUsecase {
  constructor(private readonly catsRepository: ICatsRepository, private readonly loggerServide: ILoggerAdapter) {}

  async execute(input: CatsCreateInput): Promise<CatsCreateOutput> {
    const entity = new CatsEntity({
      name: input.name,
      breed: input.breed,
      age: input.age
    });

    const cats = await this.catsRepository.create(entity);

    this.loggerServide.info({ message: 'cats created.', obj: { cats } });

    return cats;
  }
}
