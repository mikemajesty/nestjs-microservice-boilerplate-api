import { z } from 'zod';

import { ICatsRepository } from '@/core/cats/repository/cats';
import { ILoggerAdapter } from '@/infra/logger';
import { DatabaseOptionsType } from '@/utils/database/sequelize';
import { ValidateSchema } from '@/utils/decorators/validate-schema.decorator';
import { ApiNotFoundException } from '@/utils/exception';

import { CatsEntity, CatsEntitySchema } from './../entity/cats';

export const CatsUpdateSchema = CatsEntitySchema.pick({
  id: true
}).merge(CatsEntitySchema.omit({ id: true }).partial());

export type CatsUpdateInput = z.infer<typeof CatsUpdateSchema>;
export type CatsUpdateOutput = Promise<CatsEntity>;

export class CatsUpdateUsecase {
  constructor(private readonly catsRepository: ICatsRepository, private readonly loggerServide: ILoggerAdapter) {}

  @ValidateSchema(CatsUpdateSchema)
  async execute(input: CatsUpdateInput): CatsUpdateOutput {
    const cats = await this.catsRepository.findById<DatabaseOptionsType>(input.id);

    if (!cats) {
      throw new ApiNotFoundException();
    }

    const entity = new CatsEntity({ ...cats, ...input });

    await this.catsRepository.updateOne({ id: entity.id }, entity);

    this.loggerServide.info({ message: 'cats updated.', obj: { cats: input } });

    const updated = await this.catsRepository.findById<DatabaseOptionsType>(entity.id);

    return new CatsEntity(updated);
  }
}
