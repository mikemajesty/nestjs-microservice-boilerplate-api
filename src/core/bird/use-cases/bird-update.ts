import { IBirdRepository } from '@/core/bird/repository/bird'
import { ILoggerAdapter } from '@/infra/logger'
import { ValidateSchema } from '@/utils/decorators'
import { ApiNotFoundException } from '@/utils/exception'
import { IUsecase } from '@/utils/usecase'
import { Infer } from '@/utils/validator'

import { BirdEntity, BirdEntitySchema } from '../entity/bird'

export const BirdUpdateSchema = BirdEntitySchema.pick({
  id: true
}).merge(BirdEntitySchema.omit({ id: true }).partial())

export class BirdUpdateUsecase implements IUsecase {
  constructor(
    private readonly birdRepository: IBirdRepository,
    private readonly loggerService: ILoggerAdapter
  ) {}

  @ValidateSchema(BirdUpdateSchema)
  async execute(input: BirdUpdateInput): Promise<BirdUpdateOutput> {
    const bird = await this.birdRepository.findById(input.id)

    if (!bird) {
      throw new ApiNotFoundException()
    }

    const entity = new BirdEntity({ ...bird, ...input })

    await this.birdRepository.updateOne({ id: entity.id }, entity.toObject())

    this.loggerService.info({ message: 'bird updated.', obj: { bird: input } })

    const updated = await this.birdRepository.findById(entity.id)

    return new BirdEntity(updated as BirdEntity).toObject()
  }
}

export type BirdUpdateInput = Infer<typeof BirdUpdateSchema>
export type BirdUpdateOutput = BirdEntity
