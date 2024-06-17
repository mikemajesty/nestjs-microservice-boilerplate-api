import { IRepository } from '@/infra/repository';

import { CatsEntity } from '../entity/cats';
import { CatsListInput, CatsListOutput } from '../use-cases/cats-list';

export abstract class ICatsRepository extends IRepository<CatsEntity> {
  abstract paginate(input: CatsListInput): Promise<CatsListOutput>;
}
