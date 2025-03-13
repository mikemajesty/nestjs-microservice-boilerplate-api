import { CreatedModel } from '@/infra/repository';
import { ValidateSchema } from '@/utils/decorators';
import { ApiTrancingInput } from '@/utils/request';
import { IUsecase } from '@/utils/usecase';
import { UUIDUtils } from '@/utils/uuid';
import { Infer } from '@/utils/validator';

import { CatEntity, CatEntitySchema } from '../entity/cat';
import { ICatRepository } from '../repository/cat';

export const CatCreateSchema = CatEntitySchema.pick({
  name: true,
  breed: true,
  age: true
});

export class CatCreateUsecase implements IUsecase {
  constructor(private readonly catRepository: ICatRepository) {}

  @ValidateSchema(CatCreateSchema)
  async execute(input: CatCreateInput, { tracing, user }: ApiTrancingInput): Promise<CatCreateOutput> {
    const entity = new CatEntity({ id: UUIDUtils.create(), ...input });

    const created = await this.catRepository.create(entity);

    tracing.logEvent('cat-created', `cat created by: ${user.email}`);

    return created;
  }
}

export type CatCreateInput = Infer<typeof CatCreateSchema>;
export type CatCreateOutput = CreatedModel;
