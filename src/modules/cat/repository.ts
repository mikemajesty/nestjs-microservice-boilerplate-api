import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PaginateModel } from 'mongoose';

import { CatEntity } from '@/core/cat/entity/cat';
import { ICatRepository } from '@/core/cat/repository/cat';
import { CatListInput, CatListOutput } from '@/core/cat/use-cases/cat-list';
import { Cat, CatDocument } from '@/infra/database/mongo/schemas/cat';
import { MongoRepository } from '@/infra/repository';
import { MongoRepositoryModelSessionType } from '@/utils/database/mongoose';
import { ConvertMongooseFilter, SearchTypeEnum, ValidateDatabaseSortAllowed } from '@/utils/decorators';

@Injectable()
export class CatRepository extends MongoRepository<CatDocument> implements ICatRepository {
  constructor(@InjectModel(Cat.name) readonly entity: MongoRepositoryModelSessionType<PaginateModel<CatDocument>>) {
    super(entity);
  }

  @ValidateDatabaseSortAllowed<CatEntity>('createdAt', 'breed')
  @ConvertMongooseFilter<CatEntity>([
    { name: 'name', type: SearchTypeEnum.like },
    { name: 'breed', type: SearchTypeEnum.like },
    { name: 'age', type: SearchTypeEnum.equal }
  ])
  async paginate({ limit, page, search, sort }: CatListInput): Promise<CatListOutput> {
    const cats = await this.entity.paginate(search, { page, limit, sort });

    return {
      docs: cats.docs.map((u) => new CatEntity(u.toObject({ virtuals: true }))),
      limit,
      page,
      total: cats.totalDocs
    };
  }
}
