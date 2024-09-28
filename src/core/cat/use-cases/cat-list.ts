import { z } from 'zod';

import { CatEntity } from '@/core/cat/entity/cat';
import { ValidateSchema } from '@/utils/decorators';
import { PaginationInput, PaginationOutput, PaginationSchema } from '@/utils/pagination';
import { SearchSchema } from '@/utils/search';
import { SortSchema } from '@/utils/sort';
import { IUsecase } from '@/utils/usecase';

import { ICatRepository } from '../repository/cat';

export const CatListSchema = z.intersection(PaginationSchema, SortSchema.merge(SearchSchema));

export type CatListInput = PaginationInput<CatEntity>;
export type CatListOutput = PaginationOutput<CatEntity>;

export class CatListUsecase implements IUsecase {
  constructor(private readonly catRepository: ICatRepository) {}

  @ValidateSchema(CatListSchema)
  async execute(input: CatListInput): Promise<CatListOutput> {
    return await this.catRepository.paginate(input);
  }
}
