import { ICatsRepository } from '@/core/cats/repository/cats';
import { CatsDeleteInput, CatsDeleteOutput, CatsDeleteSchema } from '@/modules/cats/types';
import { ValidateSchema } from '@/utils/decorators/validate-schema.decorator';
import { ApiNotFoundException } from '@/utils/exception';

import { CatsEntity } from '../entity/cats';

export class CatsDeleteUsecase {
  constructor(private readonly catsRepository: ICatsRepository) {}

  @ValidateSchema(CatsDeleteSchema)
  async execute({ id }: CatsDeleteInput): Promise<CatsDeleteOutput> {
    const model = await this.catsRepository.findById(id);

    if (!model) {
      throw new ApiNotFoundException('catsNotFound');
    }

    const cats = new CatsEntity(model);

    cats.setDelete();

    await this.catsRepository.updateOne({ id: cats.id }, cats);

    return cats;
  }
}
