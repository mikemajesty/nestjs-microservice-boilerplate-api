import { ICatsRepository } from '@/core/cats/repository/cats';
import { ILoggerAdapter } from '@/infra/logger';
import { CatsUpdateInput, CatsUpdateOutput, CatsUpdateSchema } from '@/modules/cats/types';
import { ValidateSchema } from '@/utils/decorators/validate-schema.decorator';
import { ApiNotFoundException } from '@/utils/exception';

import { CatsEntity } from './../entity/cats';

export class CatsUpdateUsecase {
  constructor(private readonly catsRepository: ICatsRepository, private readonly loggerServide: ILoggerAdapter) {}

  @ValidateSchema(CatsUpdateSchema)
  async execute(input: CatsUpdateInput): Promise<CatsUpdateOutput> {
    const cats = await this.catsRepository.findById(input.id, { schema: 'schema2' });

    if (!cats) {
      throw new ApiNotFoundException('catsNotFound');
    }

    const catsFinded = new CatsEntity(cats);

    const entity = new CatsEntity({ ...catsFinded, ...input });

    await this.catsRepository.updateOne({ id: entity.id }, entity, { schema: 'schema2' });

    this.loggerServide.info({ message: 'cats updated.', obj: { cats: input } });

    const updated = await this.catsRepository.findById(entity.id, { schema: 'schema2' });

    return new CatsEntity(updated);
  }
}
