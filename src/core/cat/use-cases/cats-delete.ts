import { z } from 'zod';

import { ICatsRepository } from '@/core/cat/repository/cats';
import { ValidateSchema } from '@/utils/decorators';
import { ApiNotFoundException } from '@/utils/exception';
import { ApiTrancingInput } from '@/utils/request';
import { IUsecase } from '@/utils/usecase';

import { CatsEntity, CatsEntitySchema } from '../entity/cats';

export const CatsDeleteSchema = CatsEntitySchema.pick({
  id: true
});

export type CatsDeleteInput = z.infer<typeof CatsDeleteSchema>;
export type CatsDeleteOutput = CatsEntity;

export class CatsDeleteUsecase implements IUsecase {
  constructor(private readonly catsRepository: ICatsRepository) {}

  @ValidateSchema(CatsDeleteSchema)
  async execute({ id }: CatsDeleteInput, { tracing, user }: ApiTrancingInput): Promise<CatsDeleteOutput> {
    const model = await this.catsRepository.findById(id);

    if (!model) {
      throw new ApiNotFoundException();
    }

    const cats = new CatsEntity(model);

    cats.deactivated();

    await this.catsRepository.updateOne({ id: cats.id }, cats);
    tracing.logEvent('cats-deleted', `cats deleted by: ${user.email}`);

    return cats;
  }
}
