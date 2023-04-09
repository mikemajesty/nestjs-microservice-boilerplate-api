import { CreatedModel, IRepository } from '@/infra/repository';
import { CatsListInput, CatsListOutput } from '@/modules/cats/types';

import { CatsEntity } from '../entity/cats';

export abstract class ICatsRepository extends IRepository<CatsEntity> {
  abstract paginate(input: CatsListInput): Promise<CatsListOutput>;
  abstract executeWithTransaction(input: CatsEntity): Promise<CreatedModel>;
}
