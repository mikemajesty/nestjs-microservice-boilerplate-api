import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PaginateModel } from 'mongoose';

import { CatsEntity } from '@/core/cat/entity/cats';
import { ICatsRepository } from '@/core/cat/repository/cats';
import { CatsListInput, CatsListOutput } from '@/core/cat/use-cases/cats-list';
import { Cat, CatDocument } from '@/infra/database/mongo/schemas/cat';
import { MongoRepository } from '@/infra/repository';
import { MongoRepositoryModelSessionType } from '@/utils/database/mongoose';
import { ConvertMongooseFilter, SearchTypeEnum, ValidateDatabaseSortAllowed } from '@/utils/decorators';

@Injectable()
export class CatsRepository extends MongoRepository<CatDocument> implements ICatsRepository {
  constructor(@InjectModel(Cat.name) readonly entity: MongoRepositoryModelSessionType<PaginateModel<CatDocument>>) {
    super(entity);
  }

  @ValidateDatabaseSortAllowed<CatsEntity>('createdAt', 'breed')
  @ConvertMongooseFilter<CatsEntity>([
    { name: 'name', type: SearchTypeEnum.like },
    { name: 'breed', type: SearchTypeEnum.like },
    { name: 'age', type: SearchTypeEnum.equal }
  ])
  async paginate({ limit, page, search, sort }: CatsListInput): Promise<CatsListOutput> {
    const cats = await this.entity.paginate(search, { page, limit, sort });

    return {
      docs: cats.docs.map((u) => new CatsEntity(u.toObject({ virtuals: true }))),
      limit,
      page,
      total: cats.totalDocs
    };
  }
}
