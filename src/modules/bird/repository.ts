import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PaginateModel } from 'mongoose';

import { IBirdRepository } from '@/core/bird/repository/bird';
import { BirdListInput, BirdListOutput } from '@/core/bird/use-cases/bird-list';
import { Bird, BirdDocument } from '@/infra/database/mongo/schemas/bird';
import { MongoRepository } from '@/infra/repository';
import { MongoRepositoryModelSessionType, MongoRepositorySession } from '@/utils/database/mongoose';
import { ValidateMongooseFilter } from '@/utils/decorators/database/mongo/validate-mongoose-filter.decorator';
import { ValidateDatabaseSortAllowed } from '@/utils/decorators/database/validate-database-sort-allowed.decorator';
import { SearchTypeEnum } from '@/utils/decorators/types';

@Injectable()
export class BirdRepository extends MongoRepository<BirdDocument> implements IBirdRepository {
  constructor(@InjectModel(Bird.name) readonly entity: MongoRepositoryModelSessionType<PaginateModel<BirdDocument>>) {
    super(entity);
  }

  async startSession<TTransaction = MongoRepositorySession>(): Promise<TTransaction> {
    const session = await this.entity.connection.startSession();
    session.startTransaction();

    return session as TTransaction;
  }

  @ValidateMongooseFilter([{ name: 'name', type: SearchTypeEnum.like }])
  @ValidateDatabaseSortAllowed('name', 'createdAt')
  async paginate({ limit, page, sort, search }: BirdListInput): Promise<BirdListOutput> {
    const birds = await this.entity.paginate(search, { page, limit, sort });

    return { docs: birds.docs.map((u) => u.toObject({ virtuals: true })), limit, page, total: birds.totalDocs };
  }
}
