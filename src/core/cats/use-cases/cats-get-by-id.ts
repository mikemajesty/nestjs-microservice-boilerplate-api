import { z } from 'zod';

import { ValidateSchema } from '@/common/decorators';
import { CatsEntitySchema } from '@/core/cats/entity/cats';
import { ApiNotFoundException } from '@/utils/exception';

import { CatsEntity } from '../entity/cats';
import { ICatsRepository } from '../repository/cats';

export const CatsGetByIdSchema = CatsEntitySchema.pick({
  id: true
});

export type CatsGetByIdInput = z.infer<typeof CatsGetByIdSchema>;
export type CatsGetByIdOutput = CatsEntity;

export class CatsGetByIdUsecase {
  constructor(private readonly catsRepository: ICatsRepository) {}

  @ValidateSchema(CatsGetByIdSchema)
  async execute({ id }: CatsGetByIdInput): Promise<CatsGetByIdOutput> {
    const cats = await this.catsRepository.findById(id);

    if (!cats) {
      throw new ApiNotFoundException();
    }

    return new CatsEntity(cats);
  }
}
