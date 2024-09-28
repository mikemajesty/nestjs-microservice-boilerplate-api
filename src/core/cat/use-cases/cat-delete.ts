import { z } from 'zod';

import { ICatRepository } from '@/core/cat/repository/cat';
import { ValidateSchema } from '@/utils/decorators';
import { ApiNotFoundException } from '@/utils/exception';
import { ApiTrancingInput } from '@/utils/request';
import { IUsecase } from '@/utils/usecase';

import { CatEntity, CatEntitySchema } from '../entity/cat';

export const CatDeleteSchema = CatEntitySchema.pick({
  id: true
});

export type CatDeleteInput = z.infer<typeof CatDeleteSchema>;
export type CatDeleteOutput = CatEntity;

export class CatDeleteUsecase implements IUsecase {
  constructor(private readonly catRepository: ICatRepository) {}

  @ValidateSchema(CatDeleteSchema)
  async execute({ id }: CatDeleteInput, { tracing, user }: ApiTrancingInput): Promise<CatDeleteOutput> {
    const cat = await this.catRepository.findById(id);

    if (!cat) {
      throw new ApiNotFoundException();
    }

    const entity = new CatEntity(cat);

    entity.deactivated();

    await this.catRepository.updateOne({ id: entity.id }, entity);
    tracing.logEvent('cat-deleted', `cat deleted by: ${user.email}`);

    return entity;
  }
}
