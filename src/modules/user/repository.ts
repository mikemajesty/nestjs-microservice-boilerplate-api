import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PaginateModel } from 'mongoose';

import { UserEntity } from '@/core/user/entity/user';
import { IUserRepository } from '@/core/user/repository/user';
import { MongoRepository } from '@/infra/repository';
import { convertMongoFilter } from '@/utils/mongo';

import { User, UserDocument } from './schema';
import { UserListInput, UserListOutput } from './types';

@Injectable()
export class UserRepository extends MongoRepository<UserDocument> implements IUserRepository {
  constructor(@InjectModel(User.name) readonly entity: PaginateModel<UserDocument>) {
    super(entity);
  }

  async existsOnUpdate(equalFilter: Partial<UserEntity>, notEqualFilter: UserEntity[]): Promise<boolean> {
    convertMongoFilter<UserDocument>([equalFilter]);
    convertMongoFilter<UserDocument>(notEqualFilter);

    const user = await this.entity.findOne({ ...equalFilter, $nor: notEqualFilter });

    return !!user;
  }

  async paginate({ limit, page, filter }: UserListInput): Promise<UserListOutput> {
    convertMongoFilter<UserDocument>([filter]);
    const users = await this.entity.paginate({ ...filter, deletedAt: null }, { page, limit });

    return { docs: users.docs.map((u) => u.toObject({ virtuals: true })), limit, page, total: users.totalDocs };
  }
}
