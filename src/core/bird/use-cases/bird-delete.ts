import { z } from 'zod';

import { ValidateSchema } from '@/utils/decorators/validate-schema.decorator';
import { ApiNotFoundException } from '@/utils/exception';

import { BirdEntity, BirdEntitySchema } from '../entity/bird';
import { IBirdRepository } from '../repository/bird';

export const BirdDeleteSchema = BirdEntitySchema.pick({
  id: true
});

export type BirdDeleteInput = z.infer<typeof BirdDeleteSchema>;
export type BirdDeleteOutput = Promise<BirdEntity>;

export class BirdDeleteUsecase {
  constructor(private readonly birdRepository: IBirdRepository) {}

  @ValidateSchema(BirdDeleteSchema)
  async execute({ id }: BirdDeleteInput): Promise<BirdDeleteOutput> {
    const model = await this.birdRepository.findById(id);

    if (!model) {
      throw new ApiNotFoundException();
    }

    const bird = new BirdEntity(model);

    bird.setDelete();

    await this.birdRepository.updateOne({ id: bird.id }, bird);

    return bird;
  }
}
