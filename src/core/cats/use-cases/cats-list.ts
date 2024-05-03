import { z } from 'zod';

import { ValidateSchema } from '@/common/decorators';
import { CatsEntity } from '@/core/cats/entity/cats';
import { PaginationInput, PaginationOutput, PaginationSchema } from '@/utils/pagination';
import { SearchSchema } from '@/utils/search';
import { SortSchema } from '@/utils/sort';
import { IUsecase } from '@/utils/usecase';

import { ICatsRepository } from '../repository/cats';

export const CatsListSchema = z.intersection(PaginationSchema, SortSchema.merge(SearchSchema));

export type CatsListInput = PaginationInput<CatsEntity>;
export type CatsListOutput = PaginationOutput<CatsEntity>;

export class CatsListUsecase implements IUsecase {
  constructor(private readonly catsRepository: ICatsRepository) {}

  @ValidateSchema(CatsListSchema)
  async execute(input: CatsListInput): Promise<CatsListOutput> {
    return await this.catsRepository.paginate(input);
  }
}
