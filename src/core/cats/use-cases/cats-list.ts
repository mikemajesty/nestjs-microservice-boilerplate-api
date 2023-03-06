import { CatsListInput, CatsListOutput } from '@/modules/cats/types';

import { ICatsRepository } from '../repository/cats';

export class CatsListUsecase {
  constructor(private readonly catsRepository: ICatsRepository) {}

  async execute(input: CatsListInput): Promise<CatsListOutput> {
    return await this.catsRepository.paginate(input);
  }
}
