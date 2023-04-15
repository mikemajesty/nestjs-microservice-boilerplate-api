import { DogGetByIDInput, DogGetByIDOutput } from '@/modules/dog/types';
import { DogGetByIdSchema } from '@/modules/dog/types';
import { ValidateSchema } from '@/utils/decorators/validate-schema.decorator';
import { ApiNotFoundException } from '@/utils/exception';

import { DogEntity } from '../entity/dog';
import { IDogRepository } from '../repository/dog';

export class DogGetByIdUsecase {
  constructor(private readonly dogRepository: IDogRepository) {}

  @ValidateSchema(DogGetByIdSchema)
  async execute({ id }: DogGetByIDInput): Promise<DogGetByIDOutput> {
    const dog = await this.dogRepository.findById(id, { schema: 'schema2' });

    if (!dog) {
      throw new ApiNotFoundException('dogNotFound');
    }

    return new DogEntity(dog);
  }
}
