import { Transaction } from 'sequelize';

import { IRepository } from '@/infra/repository';
import { CatsListInput, CatsListOutput } from '@/modules/cats/types';

import { CatsEntity } from '../entity/cats';

export abstract class ICatsRepository extends IRepository<CatsEntity> {
  abstract paginate(input: CatsListInput, options?: unknown): Promise<CatsListOutput>;
  abstract startSession<TTransaction = Transaction>(): Promise<TTransaction>;
}
