import { CatsListInput, CatsListOutput, CatsListSchema } from '@/modules/cats/types';
import { ValidateSchema } from '@/utils/decorators/validate-schema.decorator';

import { ICatsRepository } from '../repository/cats';

export class CatsListUsecase {
  constructor(private readonly catsRepository: ICatsRepository) {}

  @ValidateSchema(CatsListSchema)
  async execute(input: CatsListInput): Promise<CatsListOutput> {
    return await this.catsRepository.paginate(input, { schema: 'schema2' });
  }
}
