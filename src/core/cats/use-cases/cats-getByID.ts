import { z } from 'zod';

import { CatsEntitySchema } from '@/core/cats/entity/cats';
import { DatabaseOptionsType } from '@/utils/database/sequelize';
import { ValidateSchema } from '@/utils/decorators/validate-schema.decorator';
import { ApiNotFoundException } from '@/utils/exception';

import { CatsEntity } from '../entity/cats';
import { ICatsRepository } from '../repository/cats';

export const CatsGetByIdSchema = CatsEntitySchema.pick({
  id: true
});

export type CatsGetByIDInput = z.infer<typeof CatsGetByIdSchema>;
export type CatsGetByIDOutput = CatsEntity;

export class CatsGetByIdUsecase {
  constructor(private readonly catsRepository: ICatsRepository) {}

  @ValidateSchema(CatsGetByIdSchema)
  async execute({ id }: CatsGetByIDInput): Promise<CatsGetByIDOutput> {
    const cats = await this.catsRepository.findById<DatabaseOptionsType>(id);

    if (!cats) {
      throw new ApiNotFoundException();
    }

    return new CatsEntity(cats);
  }
}
