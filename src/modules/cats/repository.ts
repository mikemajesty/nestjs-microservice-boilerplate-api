import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';

import { CatsEntity } from '@/core/cats/entity/cats';
import { ICatsRepository } from '@/core/cats/repository/cats';
import { PostgresRepository } from '@/infra/repository/postgres/repository';
import { ValidateDatabaseSort } from '@/utils/decorators/validate-allowed-sort-order.decorator';
import { SearchTypeEnum, ValidatePostgresFilter } from '@/utils/decorators/validate-postgres-filter.decorator';
import { calucaleSkip } from '@/utils/pagination';

import { CatsSchema } from './schema';
import { CatsListInput, CatsListOutput } from './types';

@Injectable()
export class CatsRepository
  extends PostgresRepository<CatsSchema & CatsEntity>
  implements Omit<ICatsRepository, 'updateMany' | 'seed'>
{
  constructor(readonly repository: Repository<CatsSchema & CatsEntity>) {
    super(repository);
  }

  @ValidatePostgresFilter([
    { name: 'name', type: SearchTypeEnum.like },
    { name: 'breed', type: SearchTypeEnum.like },
    { name: 'age', type: SearchTypeEnum.equal }
  ])
  @ValidateDatabaseSort(['createdAt', 'name', 'breed', 'age'])
  async paginate(input: CatsListInput): Promise<CatsListOutput> {
    const skip = calucaleSkip(input);

    const [docs, total] = await this.repository.findAndCount({
      take: input.limit,
      skip,
      order: input.sort,
      where: input.search
    });

    return { docs, total, page: input.page, limit: input.limit };
  }
}
