import { z } from 'zod';

import { ValidateSchema } from '@/utils/decorators/validate-schema.decorator';
import { ApiNotFoundException } from '@/utils/exception';

import { BirdEntity, BirdEntitySchema } from '../entity/bird';
import { IBirdRepository } from '../repository/bird';

export const BirdGetByIdSchema = BirdEntitySchema.pick({
  id: true
});
export type BirdGetByIDInput = z.infer<typeof BirdGetByIdSchema>;
export type BirdGetByIDOutput = Promise<BirdEntity>;

export class BirdGetByIdUsecase {
  constructor(private readonly birdRepository: IBirdRepository) {}

  @ValidateSchema(BirdGetByIdSchema)
  async execute({ id }: BirdGetByIDInput): Promise<BirdGetByIDOutput> {
    const bird = await this.birdRepository.findById(id);

    if (!bird) {
      throw new ApiNotFoundException();
    }

    const entity = new BirdEntity(bird);

    return entity;
  }
}
