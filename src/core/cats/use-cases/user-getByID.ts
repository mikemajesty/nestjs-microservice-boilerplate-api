import { CatsGetByIDInput, CatsGetByIDOutput } from '@/modules/cats/types';
import { ApiNotFoundException } from '@/utils/exception';

import { ICatsRepository } from '../repository/cats';
import { CatsEntity } from './../entity/cats';

export class CatsGetByIdUsecase {
  constructor(private readonly catsRepository: ICatsRepository) {}

  async execute({ id }: CatsGetByIDInput): Promise<CatsGetByIDOutput> {
    const cats = await this.catsRepository.findById(id);

    if (!cats) {
      throw new ApiNotFoundException('catsNotFound');
    }

    return new CatsEntity(cats);
  }
}
