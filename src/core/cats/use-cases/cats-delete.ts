import { z } from 'zod';

import { ValidateSchema } from '@/common/decorators';
import { ICatsRepository } from '@/core/cats/repository/cats';
import { ApiNotFoundException } from '@/utils/exception';
import { ApiTrancingInput } from '@/utils/request';

import { CatsEntity, CatsEntitySchema } from '../entity/cats';

export const CatsDeleteSchema = CatsEntitySchema.pick({
  id: true
});

export type CatsDeleteInput = z.infer<typeof CatsDeleteSchema>;
export type CatsDeleteOutput = CatsEntity;

export class CatsDeleteUsecase {
  constructor(private readonly catsRepository: ICatsRepository) {}

  @ValidateSchema(CatsDeleteSchema)
  async execute({ id }: CatsDeleteInput, { tracing, user }: ApiTrancingInput): Promise<CatsDeleteOutput> {
    const model = await this.catsRepository.findById(id);

    if (!model) {
      throw new ApiNotFoundException();
    }

    const cats = new CatsEntity(model);

    cats.setDeleted();

    await this.catsRepository.updateOne({ id: cats.id }, cats);
    tracing.logEvent('cats-deleted', `cats deleted by: ${user.login}`);

    return cats;
  }
}
