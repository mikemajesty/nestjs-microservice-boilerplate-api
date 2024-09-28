import { z } from 'zod';

import { ICatRepository } from '@/core/cat/repository/cat';
import { ILoggerAdapter } from '@/infra/logger';
import { ValidateSchema } from '@/utils/decorators';
import { ApiNotFoundException } from '@/utils/exception';
import { ApiTrancingInput } from '@/utils/request';
import { IUsecase } from '@/utils/usecase';

import { CatEntity, CatEntitySchema } from '../entity/cat';

export const CatUpdateSchema = CatEntitySchema.pick({
  id: true
}).merge(CatEntitySchema.omit({ id: true }).partial());

export type CatUpdateInput = z.infer<typeof CatUpdateSchema>;
export type CatUpdateOutput = CatEntity;

export class CatUpdateUsecase implements IUsecase {
  constructor(
    private readonly catRepository: ICatRepository,
    private readonly loggerService: ILoggerAdapter
  ) {}

  @ValidateSchema(CatUpdateSchema)
  async execute(input: CatUpdateInput, { tracing, user }: ApiTrancingInput): Promise<CatUpdateOutput> {
    const cat = await this.catRepository.findById(input.id);

    if (!cat) {
      throw new ApiNotFoundException();
    }

    const entity = new CatEntity({ ...cat, ...input });

    await this.catRepository.updateOne({ id: entity.id }, entity);

    this.loggerService.info({ message: 'cat updated.', obj: { cat: input } });

    const updated = await this.catRepository.findById(entity.id);

    tracing.logEvent('cat-updated', `cat updated by: ${user.email}`);

    return new CatEntity(updated);
  }
}
