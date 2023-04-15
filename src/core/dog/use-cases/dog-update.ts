import { IDogRepository } from '@/core/dog/repository/dog';
import { DogUpdateInput, DogUpdateOutput, DogUpdateSchema } from '@/modules/dog/types';
import { ValidateSchema } from '@/utils/decorators/validate-schema.decorator';
import { ApiNotFoundException } from '@/utils/exception';

import { DogEntity } from './../entity/dog';

export class DogUpdateUsecase {
  constructor(private readonly dogRepository: IDogRepository) {}

  @ValidateSchema(DogUpdateSchema)
  async execute(input: DogUpdateInput): Promise<DogUpdateOutput> {
    const dog = await this.dogRepository.findById(input.id, { schema: 'schema2' });

    if (!dog) {
      throw new ApiNotFoundException('dogNotFound');
    }

    const dogFinded = new DogEntity(dog);

    const entity = new DogEntity({ ...dogFinded, ...input });

    await this.dogRepository.updateOne({ id: entity.id }, entity, { schema: 'schema2' });

    const updated = await this.dogRepository.findById(entity.id, { schema: 'schema2' });

    return new DogEntity(updated);
  }
}
