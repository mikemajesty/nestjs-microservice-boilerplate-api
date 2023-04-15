import { DogCreateInput, DogCreateOutput, DogCreateSchema } from '@/modules/dog/types';
import { ValidateSchema } from '@/utils/decorators/validate-schema.decorator';

import { IDogRepository } from '../repository/dog';
import { DogEntity } from './../entity/dog';

export class DogCreateUsecase {
  constructor(private readonly dogRepository: IDogRepository) {}

  @ValidateSchema(DogCreateSchema)
  async execute(input: DogCreateInput): Promise<DogCreateOutput> {
    const entity = new DogEntity(input);

    const created = await this.dogRepository.create(entity, { schema: 'schema2' });

    return created;
  }
}
