import { z } from 'zod';

import { CatsEntity } from '@/core/cats/entity/cats';
import { ValidateSchema } from '@/utils/decorators/validate-schema.decorator';
import { PaginationInput, PaginationOutput, PaginationSchema } from '@/utils/pagination';
import { SearchSchema } from '@/utils/search';
import { SortSchema } from '@/utils/sort';

import { ICatsRepository } from '../repository/cats';

export const CatsListSchema = z.intersection(PaginationSchema, SortSchema.merge(SearchSchema));

export type CatsListInput = PaginationInput<CatsEntity>;
export type CatsListOutput = PaginationOutput<CatsEntity>;

export class CatsListUsecase {
  constructor(private readonly catsRepository: ICatsRepository) {}

  @ValidateSchema(CatsListSchema)
  async execute(input: CatsListInput): Promise<CatsListOutput> {
    return await this.catsRepository.paginate(input);
  }
}
