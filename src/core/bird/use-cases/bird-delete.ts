import { IBirdRepository } from '@/core/bird/repository/bird'
import { ValidateSchema } from '@/utils/decorators'
import { ApiNotFoundException } from '@/utils/exception'
import { IUsecase } from '@/utils/usecase'
import { Infer } from '@/utils/validator'

import { BirdEntity, BirdEntitySchema } from '../entity/bird'

export const BirdDeleteSchema = BirdEntitySchema.pick({
  id: true
})

export class BirdDeleteUsecase implements IUsecase {
  constructor(private readonly birdRepository: IBirdRepository) {}

  @ValidateSchema(BirdDeleteSchema)
  async execute({ id }: BirdDeleteInput): Promise<BirdDeleteOutput> {
    const bird = await this.birdRepository.findById(id)

    if (!bird) {
      throw new ApiNotFoundException()
    }

    const entity = new BirdEntity(bird)

    entity.deactivate()

    await this.birdRepository.updateOne({ id: entity.id }, entity.toObject())

    return entity.toObject()
  }
}

export type BirdDeleteInput = Infer<typeof BirdDeleteSchema>
export type BirdDeleteOutput = BirdEntity
