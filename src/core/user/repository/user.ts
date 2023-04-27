import { IRepository } from '@/infra/repository';
import { MongoRepositorySession } from '@/utils/database/mongoose';

import { UserEntity } from '../entity/user';
import { UserListInput, UserListOutput } from '../use-cases/user-list';

export abstract class IUserRepository extends IRepository<UserEntity> {
  abstract existsOnUpdate(
    equalFilter: Pick<UserEntity, 'login' | 'password'>,
    notEqualFilter: Pick<UserEntity, 'id'>
  ): Promise<boolean>;
  abstract paginate(input: UserListInput): Promise<UserListOutput>;
  abstract startSession(): Promise<MongoRepositorySession>;
}
