import { IRepository } from '@/infra/repository';
import { UserListInput, UserListOutput } from '@/modules/user/types';

import { UserEntity } from '../entity/user';

export abstract class IUserRepository extends IRepository<UserEntity> {
  abstract existsOnUpdate(equalFilter: Partial<UserEntity>, notEqualFilter: Partial<UserEntity>[]): Promise<boolean>;
  abstract paginate(input: UserListInput): Promise<UserListOutput>;
}
