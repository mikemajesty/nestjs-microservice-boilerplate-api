import { z } from 'zod';

import { CatEntitySchema } from '@/core/cat/entity/cat';
import { ValidateSchema } from '@/utils/decorators';
import { ApiNotFoundException } from '@/utils/exception';
import { IUsecase } from '@/utils/usecase';

import { CatEntity } from '../entity/cat';
import { ICatRepository } from '../repository/cat';

export const CatGetByIdSchema = CatEntitySchema.pick({
  id: true
});

export type CatGetByIdInput = z.infer<typeof CatGetByIdSchema>;
export type CatGetByIdOutput = CatEntity;

export class CatGetByIdUsecase implements IUsecase {
  constructor(private readonly catRepository: ICatRepository) {}

  @ValidateSchema(CatGetByIdSchema)
  async execute({ id }: CatGetByIdInput): Promise<CatGetByIdOutput> {
    const cat = await this.catRepository.findById(id);

    if (!cat) {
      throw new ApiNotFoundException();
    }

    return new CatEntity(cat);
  }
}
