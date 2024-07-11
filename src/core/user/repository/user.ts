import { IRepository } from '@/infra/repository';

import { UserEntity } from '../entity/user';
import { UserListInput, UserListOutput } from '../use-cases/user-list';

export abstract class IUserRepository extends IRepository<UserEntity> {
  abstract existsOnUpdate(
    equalFilter: Pick<UserEntity, 'email'>,
    notEqualFilter: Pick<UserEntity, 'id'>
  ): Promise<boolean>;
  abstract paginate(input: UserListInput): Promise<UserListOutput>;
  abstract softRemove(entity: Partial<UserEntity>): Promise<UserEntity>;
  abstract findOneWithRelation(
    filter: Partial<UserEntity>,
    relations: { [key in keyof Partial<UserEntity>]: true | false }
  ): Promise<UserEntity>;
}
