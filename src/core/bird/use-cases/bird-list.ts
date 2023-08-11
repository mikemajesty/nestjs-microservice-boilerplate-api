import { z } from 'zod';

import { ValidateSchema } from '@/utils/decorators/validate-schema.decorator';
import { PaginationInput, PaginationOutput, PaginationSchema } from '@/utils/pagination';
import { SearchSchema } from '@/utils/search';
import { SortSchema } from '@/utils/sort';

import { BirdEntity } from '../entity/bird';
import { IBirdRepository } from '../repository/bird';

export const BirdListSchema = z.intersection(PaginationSchema, SortSchema.merge(SearchSchema));

export type BirdListInput = PaginationInput<BirdEntity>;
export type BirdListOutput = Promise<PaginationOutput<BirdEntity>>;

export class BirdListUsecase {
  constructor(private readonly birdRepository: IBirdRepository) {}

  @ValidateSchema(BirdListSchema)
  async execute(input: BirdListInput): Promise<BirdListOutput> {
    const birds = await this.birdRepository.paginate(input);

    return {
      docs: birds.docs.map((u) => new BirdEntity(u)),
      limit: birds.limit,
      page: birds.page,
      total: birds.total
    };
  }
}
