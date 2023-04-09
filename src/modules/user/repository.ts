import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PaginateModel } from 'mongoose';

import { UserEntity } from '@/core/user/entity/user';
import { IUserRepository } from '@/core/user/repository/user';
import { MongoRepository } from '@/infra/repository';
import { ValidateDatabaseSort } from '@/utils/decorators/validate-allowed-sort-order.decorator';
import { SearchTypeEnum, ValidateMongoFilter } from '@/utils/decorators/validate-mongo-filter.decorator';
import { MongoRepositoryModelSessionType, MongoRepositorySession } from '@/utils/mongo';

import { User, UserDocument } from './schema';
import { UserListInput, UserListOutput } from './types';

@Injectable()
export class UserRepository extends MongoRepository<UserDocument> implements IUserRepository {
  constructor(@InjectModel(User.name) readonly entity: MongoRepositoryModelSessionType<PaginateModel<UserDocument>>) {
    super(entity);
  }

  async startSession(): Promise<MongoRepositorySession> {
    const session = await this.entity.connection.startSession();
    session.startTransaction();

    return session;
  }

  async existsOnUpdate(
    equalFilter: Pick<UserEntity, 'login' | 'password'>,
    notEqualFilter: Pick<UserEntity, 'id'>
  ): Promise<boolean> {
    const user = await this.entity.findOne({ ...equalFilter, $nor: [{ _id: notEqualFilter.id }] });

    return !!user;
  }

  @ValidateMongoFilter([{ name: 'login', type: SearchTypeEnum.like }])
  @ValidateDatabaseSort(['login', 'createdAt'])
  async paginate({ limit, page, sort, search }: UserListInput): Promise<UserListOutput> {
    const users = await this.entity.paginate(search, { page, limit, sort });

    return { docs: users.docs.map((u) => u.toObject({ virtuals: true })), limit, page, total: users.totalDocs };
  }
}
