import { ILoggerAdapter } from '@/infra/logger';
import { CatsCreateInput, CatsCreateOutput, CatsCreateSchema } from '@/modules/cats/types';
import { ValidateSchema } from '@/utils/decorators/validate-schema.decorator';

import { ICatsRepository } from '../repository/cats';
import { CatsEntity } from './../entity/cats';

export class CatsCreateUsecase {
  constructor(private readonly catsRepository: ICatsRepository, private readonly loggerServide: ILoggerAdapter) {}

  @ValidateSchema(CatsCreateSchema)
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
