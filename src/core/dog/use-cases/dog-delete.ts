import { IDogRepository } from '@/core/dog/repository/dog';
import { DogDeleteInput, DogDeleteOutput, DogDeleteSchema } from '@/modules/dog/types';
import { ValidateSchema } from '@/utils/decorators/validate-schema.decorator';
import { ApiNotFoundException } from '@/utils/exception';

import { DogEntity } from '../entity/dog';

export class DogDeleteUsecase {
  constructor(private readonly dogRepository: IDogRepository) {}

  @ValidateSchema(DogDeleteSchema)
  async execute({ id }: DogDeleteInput): Promise<DogDeleteOutput> {
    const model = await this.dogRepository.findById(id, { schema: 'schema2' });

    if (!model) {
      throw new ApiNotFoundException('dogNotFound');
    }

    const dog = new DogEntity(model);

    dog.setDelete();

    await this.dogRepository.updateOne({ id: dog.id }, dog, { schema: 'schema2' });

    return dog;
  }
}
