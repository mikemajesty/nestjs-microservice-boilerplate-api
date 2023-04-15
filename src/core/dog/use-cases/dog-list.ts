import { DogListInput, DogListOutput, DogListSchema } from '@/modules/dog/types';
import { ValidateSchema } from '@/utils/decorators/validate-schema.decorator';

import { IDogRepository } from '../repository/dog';

export class DogListUsecase {
  constructor(private readonly dogRepository: IDogRepository) {}

  @ValidateSchema(DogListSchema)
  async execute(input: DogListInput): Promise<DogListOutput> {
    return await this.dogRepository.paginate(input);
  }
}
