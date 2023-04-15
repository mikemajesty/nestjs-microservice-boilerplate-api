import { IRepository } from '@/infra/repository';
import { DogListInput, DogListOutput } from '@/modules/dog/types';

import { DogEntity } from '../entity/dog';

export abstract class IDogRepository extends IRepository<DogEntity> {
  abstract paginate(input: DogListInput): Promise<DogListOutput>;
}
