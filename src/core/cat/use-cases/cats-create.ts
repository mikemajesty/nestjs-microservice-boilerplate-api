import { z } from 'zod';

import { CreatedModel } from '@/infra/repository';
import { ValidateSchema } from '@/utils/decorators';
import { ApiTrancingInput } from '@/utils/request';
import { IUsecase } from '@/utils/usecase';

import { CatsEntity, CatsEntitySchema } from '../entity/cats';
import { ICatsRepository } from '../repository/cats';

export const CatsCreateSchema = CatsEntitySchema.pick({
  name: true,
  breed: true,
  age: true
});

export type CatsCreateInput = z.infer<typeof CatsCreateSchema>;
export type CatsCreateOutput = CreatedModel;

export class CatsCreateUsecase implements IUsecase {
  constructor(private readonly catsRepository: ICatsRepository) {}

  @ValidateSchema(CatsCreateSchema)
  async execute(input: CatsCreateInput, { tracing, user }: ApiTrancingInput): Promise<CatsCreateOutput> {
    const entity = new CatsEntity(input);

    try {
      const cats = await this.catsRepository.create(entity);

      tracing.logEvent('cats-created', `cats created by: ${user.email}`);

      return cats;
    } catch (error) {
      throw error;
    }
  }
}
