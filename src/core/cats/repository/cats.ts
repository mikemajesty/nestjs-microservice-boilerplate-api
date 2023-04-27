import { Transaction } from 'sequelize';

import { IRepository } from '@/infra/repository';
import { DatabaseOptionsType } from '@/utils/database/sequelize';

import { CatsEntity } from '../entity/cats';
import { CatsListInput, CatsListOutput } from '../use-cases/cats-list';

export abstract class ICatsRepository extends IRepository<CatsEntity> {
  abstract paginate<TOptions = DatabaseOptionsType>(input: CatsListInput, options?: TOptions): Promise<CatsListOutput>;
  abstract startSession<TTransaction = Transaction>(): Promise<TTransaction>;
}
