import { BirdEntitySchema } from '@/core/bird/entity/bird'
import { ValidateSchema } from '@/utils/decorators'
import { ApiNotFoundException } from '@/utils/exception'
import { IUsecase } from '@/utils/usecase'
import { Infer } from '@/utils/validator'

import { BirdEntity } from '../entity/bird'
import { IBirdRepository } from '../repository/bird'

export const BirdGetByIdSchema = BirdEntitySchema.pick({
  id: true
})

export class BirdGetByIdUsecase implements IUsecase {
  constructor(private readonly birdRepository: IBirdRepository) {}

  @ValidateSchema(BirdGetByIdSchema)
  async execute({ id }: BirdGetByIdInput): Promise<BirdGetByIdOutput> {
    const bird = await this.birdRepository.findById(id)

    if (!bird) {
      throw new ApiNotFoundException()
    }

    return new BirdEntity(bird).toObject()
  }
}

export type BirdGetByIdInput = Infer<typeof BirdGetByIdSchema>
export type BirdGetByIdOutput = BirdEntity
