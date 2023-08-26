import { z } from 'zod';

import { ICatsRepository } from '@/core/cats/repository/cats';
import { DatabaseOptionsType } from '@/utils/database/sequelize';
import { ValidateSchema } from '@/utils/decorators/validate-schema.decorator';
import { ApiNotFoundException } from '@/utils/exception';
import { ApiTrancingInput } from '@/utils/request';

import { CatsEntity, CatsEntitySchema } from '../entity/cats';

export const CatsDeleteSchema = CatsEntitySchema.pick({
  id: true
});

export type CatsDeleteInput = z.infer<typeof CatsDeleteSchema>;
export type CatsDeleteOutput = Promise<CatsEntity>;

export class CatsDeleteUsecase {
  constructor(private readonly catsRepository: ICatsRepository) {}

  @ValidateSchema(CatsDeleteSchema)
  async execute({ id }: CatsDeleteInput, { tracing, user }: ApiTrancingInput): CatsDeleteOutput {
    const model = await this.catsRepository.findById<DatabaseOptionsType>(id);

    if (!model) {
      throw new ApiNotFoundException();
    }

    const cats = new CatsEntity(model);

    cats.setDelete();

    await this.catsRepository.updateOne({ id: cats.id }, cats);
    tracing.logEvent('cats-deleted', `cats deleted by: ${user.login}`);

    return cats;
  }
}
