import { Injectable } from '@nestjs/common'
import { FindOptionsOrder, FindOptionsWhere, Repository } from 'typeorm'

import { BirdEntity } from '@/core/bird/entity/bird'
import { IBirdRepository } from '@/core/bird/repository/bird'
import { BirdListInput, BirdListOutput } from '@/core/bird/use-cases/bird-list'
import { BirdSchema } from '@/infra/database/postgres/schemas/bird'
import { TypeORMRepository } from '@/infra/repository/postgres/repository'
import { ConvertTypeOrmFilter, SearchTypeEnum, ValidateDatabaseSortAllowed } from '@/utils/decorators'
import { IEntity } from '@/utils/entity'
import { PaginationUtils } from '@/utils/pagination'

@Injectable()
export class BirdRepository extends TypeORMRepository<Model> implements IBirdRepository {
  constructor(readonly repository: Repository<Model>) {
    super(repository)
  }

  @ValidateDatabaseSortAllowed<BirdEntity>({ name: 'name' }, { name: 'createdAt' })
  @ConvertTypeOrmFilter<BirdEntity>([{ name: 'name', type: SearchTypeEnum.like }])
  async paginate(input: BirdListInput): Promise<BirdListOutput> {
    const skip = PaginationUtils.calculateSkip(input)

    const [docs, total] = await this.repository.findAndCount({
      take: input.limit,
      skip,
      order: input.sort as FindOptionsOrder<IEntity>,
      where: input.search as FindOptionsWhere<IEntity>
    })

    return { docs: docs.map((doc) => new BirdEntity(doc).toObject()), total, page: input.page, limit: input.limit }
  }
}

type Model = BirdSchema & BirdEntity
