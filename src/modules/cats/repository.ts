import { Injectable } from '@nestjs/common';
import { Transaction } from 'sequelize';
import { ModelCtor } from 'sequelize-typescript';

import {
  ConvertPaginateInputToSequelizeFilter,
  SearchTypeEnum,
  ValidateDatabaseSortAllowed
} from '@/common/decorators';
import { CatsEntity } from '@/core/cats/entity/cats';
import { ICatsRepository } from '@/core/cats/repository/cats';
import { CatsListInput, CatsListOutput } from '@/core/cats/use-cases/cats-list';
import { CatsSchema } from '@/infra/database/postgres/schemas/cats';
import { SequelizeRepository } from '@/infra/repository/postgres/repository';
import { DatabaseOptionsSchema, DatabaseOptionsType } from '@/utils/database/sequelize';

type Model = ModelCtor<CatsSchema> & CatsEntity;

@Injectable()
export class CatsRepository extends SequelizeRepository<Model> implements ICatsRepository {
  constructor(readonly repository: Model) {
    super(repository);
  }

  async startSession<TTransaction = Transaction>(): Promise<TTransaction> {
    const transaction = await this.repository.sequelize.transaction();

    return transaction as TTransaction;
  }

  @ValidateDatabaseSortAllowed<CatsEntity>('createdAt', 'breed')
  @ConvertPaginateInputToSequelizeFilter<CatsEntity>([
    { name: 'name', type: SearchTypeEnum.like },
    { name: 'breed', type: SearchTypeEnum.like },
    { name: 'age', type: SearchTypeEnum.equal }
  ])
  async paginate(input: CatsListInput, options: DatabaseOptionsType): Promise<CatsListOutput> {
    const { schema } = DatabaseOptionsSchema.parse(options);

    const list = await this.repository.schema(schema).findAndCountAll(input);

    return { docs: list.rows.map((r) => new CatsEntity(r)), limit: input.limit, page: input.page, total: list.count };
  }
}
