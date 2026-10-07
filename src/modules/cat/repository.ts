/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/modules/repository.md
 */
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { PaginateModel } from 'mongoose'

import { CatEntity } from '@/core/cat/entity/cat'
import { ICatRepository } from '@/core/cat/repository/cat'
import { CatListInput, CatListOutput } from '@/core/cat/use-cases/cat-list'
import { Cat, CatDocument } from '@/infra/database/mongo/schemas/cat'
import { MongoRepository } from '@/infra/repository'
import { SearchTypeEnum, TransformMongooseSearch, TransformSort } from '@/utils/decorators'
import { MongoRepositoryModelSessionType } from '@/utils/mongoose'

@Injectable()
export class CatRepository extends MongoRepository<CatDocument, CatEntity> implements ICatRepository {
  constructor(@InjectModel(Cat.name) readonly entity: MongoRepositoryModelSessionType<PaginateModel<CatDocument>>) {
    super(entity, CatEntity)
  }

  @TransformSort<CatEntity>({ name: 'createdAt' }, { name: 'breed' })
  @TransformMongooseSearch<CatEntity>([
    { name: 'name', type: SearchTypeEnum.like },
    { name: 'breed', type: SearchTypeEnum.like },
    { name: 'age', type: SearchTypeEnum.equal, format: 'Number' }
  ])
  async paginate(input: CatListInput): Promise<CatListOutput> {
    return this.applyPagination(input)
  }
}
