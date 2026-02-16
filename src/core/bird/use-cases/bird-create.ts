import { CreatedModel } from '@/infra/repository'
import { ValidateSchema } from '@/utils/decorators'
import { IDGeneratorUtils } from '@/utils/id-generator'
import { IUsecase } from '@/utils/usecase'
import { Infer } from '@/utils/validator'

import { BirdEntity, BirdEntitySchema } from '../entity/bird'
import { IBirdRepository } from '../repository/bird'

export const BirdCreateSchema = BirdEntitySchema.pick({
  name: true
})

export class BirdCreateUsecase implements IUsecase {
  constructor(private readonly birdRepository: IBirdRepository) {}

  @ValidateSchema(BirdCreateSchema)
  async execute(input: BirdCreateInput): Promise<BirdCreateOutput> {
    const entity = new BirdEntity({ id: IDGeneratorUtils.uuid(), ...input })

    const created = await this.birdRepository.create(entity.toObject())

    return created
  }
}

export type BirdCreateInput = Infer<typeof BirdCreateSchema>
export type BirdCreateOutput = CreatedModel
