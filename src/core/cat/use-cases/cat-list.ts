import { CatEntity } from '@/core/cat/entity/cat';
import { ValidateSchema } from '@/utils/decorators';
import { PaginationInput, PaginationOutput, PaginationSchema } from '@/utils/pagination';
import { SearchSchema } from '@/utils/search';
import { SortSchema } from '@/utils/sort';
import { IUsecase } from '@/utils/usecase';
import { InputValidator } from '@/utils/validator';

import { ICatRepository } from '../repository/cat';

export const CatListSchema = InputValidator.intersection(PaginationSchema, SortSchema.merge(SearchSchema));
export class CatListUsecase implements IUsecase {
  constructor(private readonly catRepository: ICatRepository) {}

  @ValidateSchema(CatListSchema)
  async execute(input: CatListInput): Promise<CatListOutput> {
    return await this.catRepository.paginate(input);
  }
}

export type CatListInput = PaginationInput<CatEntity>;
export type CatListOutput = PaginationOutput<CatEntity>;
