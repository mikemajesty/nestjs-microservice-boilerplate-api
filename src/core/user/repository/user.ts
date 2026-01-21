/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/core/repository.md
 */
import { IRepository } from '@/infra/repository'

import { UserEntity } from '../entity/user'
import { UserListInput, UserListOutput } from '../use-cases/user-list'

export abstract class IUserRepository extends IRepository<UserEntity> {
  abstract paginate(input: UserListInput): Promise<UserListOutput>
  abstract softRemove(entity: Partial<UserEntity>): Promise<UserEntity>
}
