import { IRepository } from '@/infra/repository';
import { MongoRepositorySession } from '@/utils/database/mongoose';

import { BirdEntity } from '../entity/bird';
import { BirdListInput, BirdListOutput } from '../use-cases/bird-list';

export abstract class IBirdRepository extends IRepository<BirdEntity> {
  abstract paginate(input: BirdListInput): Promise<BirdListOutput>;
  abstract startSession(): Promise<MongoRepositorySession>;
}
