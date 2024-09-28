import { z } from 'zod';

import { CreatedModel } from '@/infra/repository';
import { ValidateSchema } from '@/utils/decorators';
import { ApiTrancingInput } from '@/utils/request';
import { IUsecase } from '@/utils/usecase';

import { CatEntity, CatEntitySchema } from '../entity/cat';
import { ICatRepository } from '../repository/cat';

export const CatCreateSchema = CatEntitySchema.pick({
  name: true,
  breed: true,
  age: true
});

export type CatCreateInput = z.infer<typeof CatCreateSchema>;
export type CatCreateOutput = CreatedModel;

export class CatCreateUsecase implements IUsecase {
  constructor(private readonly catRepository: ICatRepository) {}

  @ValidateSchema(CatCreateSchema)
  async execute(input: CatCreateInput, { tracing, user }: ApiTrancingInput): Promise<CatCreateOutput> {
    const entity = new CatEntity(input);

    const created = await this.catRepository.create(entity);

    tracing.logEvent('cat-created', `cat created by: ${user.email}`);

    return created;
  }
}
