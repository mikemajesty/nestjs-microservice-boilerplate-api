import { BirdEntity } from '@/core/bird/entity/bird'
import { ValidateSchema } from '@/utils/decorators'
import { PaginationInput, PaginationOutput, PaginationSchema } from '@/utils/pagination'
import { SearchSchema } from '@/utils/search'
import { SortSchema } from '@/utils/sort'
import { IUsecase } from '@/utils/usecase'
import { InputValidator } from '@/utils/validator'

import { IBirdRepository } from '../repository/bird'

export const BirdListSchema = InputValidator.intersection(PaginationSchema, SortSchema).and(SearchSchema)

export class BirdListUsecase implements IUsecase {
  constructor(private readonly birdRepository: IBirdRepository) {}

  @ValidateSchema(BirdListSchema)
  async execute(input: BirdListInput): Promise<BirdListOutput> {
    return await this.birdRepository.paginate(input)
  }
}

export type BirdListInput = PaginationInput<BirdEntity>
export type BirdListOutput = PaginationOutput<BirdEntity>
