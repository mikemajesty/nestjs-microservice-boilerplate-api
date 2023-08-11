import { z } from 'zod';

import { ILoggerAdapter } from '@/infra/logger';
import { ValidateSchema } from '@/utils/decorators/validate-schema.decorator';
import { ApiNotFoundException } from '@/utils/exception';

import { BirdEntity, BirdEntitySchema } from '../entity/bird';
import { IBirdRepository } from '../repository/bird';

export const BirdUpdateSchema = BirdEntitySchema.pick({
  id: true
}).merge(BirdEntitySchema.omit({ id: true }).partial());

export type BirdUpdateInput = Partial<z.infer<typeof BirdUpdateSchema>>;
export type BirdUpdateOutput = Promise<BirdEntity>;

export class BirdUpdateUsecase {
  constructor(private readonly birdRepository: IBirdRepository, private readonly loggerServide: ILoggerAdapter) {}

  @ValidateSchema(BirdUpdateSchema)
  async execute(input: BirdUpdateInput): Promise<BirdUpdateOutput> {
    const bird = await this.birdRepository.findById(input.id);

    if (!bird) {
      throw new ApiNotFoundException();
    }

    const birdFinded = new BirdEntity(bird);

    const entity = new BirdEntity({ ...birdFinded, ...input });

    await this.birdRepository.updateOne({ id: entity.id }, entity);

    this.loggerServide.info({ message: 'bird updated.', obj: { bird: input } });

    const updated = await this.birdRepository.findById(entity.id);

    return new BirdEntity(updated);
  }
}
