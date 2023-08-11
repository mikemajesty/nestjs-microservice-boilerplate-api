import { z } from 'zod';

import { ILoggerAdapter } from '@/infra/logger';
import { CreatedModel } from '@/infra/repository';
import { ValidateSchema } from '@/utils/decorators/validate-schema.decorator';

import { BirdEntity, BirdEntitySchema } from '../entity/bird';
import { IBirdRepository } from '../repository/bird';

export const BirdCreateSchema = BirdEntitySchema.pick({
  name: true
});

export type BirdCreateInput = z.infer<typeof BirdCreateSchema>;
export type BirdCreateOutput = Promise<CreatedModel>;

export class BirdCreateUsecase {
  constructor(private readonly birdRepository: IBirdRepository, private readonly loggerServide: ILoggerAdapter) {}

  @ValidateSchema(BirdCreateSchema)
  async execute(input: BirdCreateInput): Promise<BirdCreateOutput> {
    const entity = new BirdEntity(input);

    const session = await this.birdRepository.startSession();

    try {
      const bird = await this.birdRepository.create(entity, { session });

      await session.commitTransaction();

      this.loggerServide.info({ message: 'bird created.', obj: { bird } });
      return bird;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    }
  }
}
