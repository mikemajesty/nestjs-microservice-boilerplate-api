import { Injectable } from '@nestjs/common';
import { ModelCtor } from 'sequelize-typescript';

import { DogEntity } from '@/core/dog/entity/dog';
import { IDogRepository } from '@/core/dog/repository/dog';
import { CatSchema } from '@/infra/database/sequelize/schemas/cats';
import { SequelizeRepository } from '@/infra/repository/sequelize/repository';
import { DogListInput, DogListOutput } from '@/modules/dog/types';
import { ConvertPaginateInputToSequelizeFilter } from '@/utils/decorators/convert-paginate-input-to-sequelize-filter.decorator';
import { SearchTypeEnum } from '@/utils/decorators/types';
import { ValidateDatabaseSortAllowed } from '@/utils/decorators/validate-database-sort-allowed.decorator';

type Model = ModelCtor<CatSchema> & DogEntity;

@Injectable()
export class DogRepository extends SequelizeRepository<Model> implements IDogRepository {
  constructor(readonly repository: Model) {
    super(repository);
  }

  @ValidateDatabaseSortAllowed(['createdAt', 'name', 'breed', 'age'])
  @ConvertPaginateInputToSequelizeFilter([
    { name: 'name', type: SearchTypeEnum.like },
    { name: 'breed', type: SearchTypeEnum.like },
    { name: 'age', type: SearchTypeEnum.equal }
  ])
  async paginate(input: DogListInput): Promise<DogListOutput> {
    const list = await this.repository.schema('schema2').findAndCountAll(input);

    return { docs: list.rows, limit: input.limit, page: input.page, total: list.count };
  }
}
