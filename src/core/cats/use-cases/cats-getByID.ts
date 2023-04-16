import { CatsGetByIDInput, CatsGetByIDOutput } from '@/modules/cats/types';
import { CatsGetByIdSchema } from '@/modules/cats/types';
import { ValidateSchema } from '@/utils/decorators/validate-schema.decorator';
import { ApiNotFoundException } from '@/utils/exception';

import { CatsEntity } from '../entity/cats';
import { ICatsRepository } from '../repository/cats';

export class CatsGetByIdUsecase {
  constructor(private readonly catsRepository: ICatsRepository) {}

  @ValidateSchema(CatsGetByIdSchema)
  async execute({ id }: CatsGetByIDInput): Promise<CatsGetByIDOutput> {
    const cats = await this.catsRepository.findById(id, { schema: 'schema2' });

    if (!cats) {
      throw new ApiNotFoundException('catsNotFound');
    }

    return new CatsEntity(cats);
  }
}
