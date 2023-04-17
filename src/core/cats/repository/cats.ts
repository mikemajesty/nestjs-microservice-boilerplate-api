import { Transaction } from 'sequelize';

import { IRepository } from '@/infra/repository';
import { CatsListInput, CatsListOutput } from '@/modules/cats/types';

import { CatsEntity } from '../entity/cats';
import { DatabaseOptionsType } from './../../../utils/database/sequelize';

export abstract class ICatsRepository extends IRepository<CatsEntity> {
  abstract paginate<TOptions = DatabaseOptionsType>(input: CatsListInput, options: TOptions): Promise<CatsListOutput>;
  abstract startSession<TTransaction = Transaction>(): Promise<TTransaction>;
}
