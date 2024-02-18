import { z } from 'zod';

import { ValidateSchema } from '@/common/decorators';
import { CreatedModel } from '@/infra/repository';
import { ApiTrancingInput } from '@/utils/request';

import { ICatsRepository } from '../repository/cats';
import { CatsEntity, CatsEntitySchema } from './../entity/cats';

export const CatsCreateSchema = CatsEntitySchema.pick({
  name: true,
  breed: true,
  age: true
});

export type CatsCreateInput = z.infer<typeof CatsCreateSchema>;
export type CatsCreateOutput = CreatedModel;

export class CatsCreateUsecase {
  constructor(private readonly catsRepository: ICatsRepository) {}

  @ValidateSchema(CatsCreateSchema)
  async execute(input: CatsCreateInput, { tracing, user }: ApiTrancingInput): Promise<CatsCreateOutput> {
    const entity = new CatsEntity(input);

    const cats = await this.catsRepository.create(entity, { transaction: true });

    tracing.logEvent('cats-created', `cats created by: ${user.login}`);

    return cats;
  }
}
