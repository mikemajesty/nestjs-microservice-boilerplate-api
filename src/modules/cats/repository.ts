import { Injectable } from '@nestjs/common';
import { Transaction } from 'sequelize';
import { ModelCtor } from 'sequelize-typescript';

import { CatsEntity } from '@/core/cats/entity/cats';
import { ICatsRepository } from '@/core/cats/repository/cats';
import { CatSchema } from '@/infra/database/postgres/schemas/cats';
import { SequelizeRepository } from '@/infra/repository/postgres/repository';
import { CatsListInput, CatsListOutput } from '@/modules/cats/types';
import { DatabaseOptionsSchema, DatabaseOptionsType } from '@/utils/database/sequelize';
import { ConvertPaginateInputToSequelizeFilter } from '@/utils/decorators/database/postgres/convert-paginate-input-to-sequelize-filter.decorator';
import { ValidateDatabaseSortAllowed } from '@/utils/decorators/database/validate-database-sort-allowed.decorator';
import { SearchTypeEnum } from '@/utils/decorators/types';

type Model = ModelCtor<CatSchema> & CatsEntity;

@Injectable()
export class CatsRepository extends SequelizeRepository<Model> implements ICatsRepository {
  constructor(readonly repository: Model) {
    super(repository);
  }

  async startSession<TTransaction = Transaction>(): Promise<TTransaction> {
    const transaction = await this.repository.sequelize.transaction();

    return transaction as TTransaction;
  }

  @ValidateDatabaseSortAllowed(['createdAt', 'name', 'breed', 'age'])
  @ConvertPaginateInputToSequelizeFilter([
    { name: 'name', type: SearchTypeEnum.like },
    { name: 'breed', type: SearchTypeEnum.like },
    { name: 'age', type: SearchTypeEnum.equal }
  ])
  async paginate(input: CatsListInput, options: DatabaseOptionsType): Promise<CatsListOutput> {
    const { schema } = DatabaseOptionsSchema.parse(options);

    const list = await this.repository.schema(schema).findAndCountAll(input);

    return { docs: list.rows, limit: input.limit, page: input.page, total: list.count };
  }
}
