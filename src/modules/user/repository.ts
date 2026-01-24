/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/modules/repository.md
 */
import { Injectable } from '@nestjs/common'
import { Repository } from 'typeorm'

import { UserEntity } from '@/core/user/entity/user'
import { IUserRepository } from '@/core/user/repository/user'
import { UserListInput, UserListOutput } from '@/core/user/use-cases/user-list'
import { UserSchema } from '@/infra/database/postgres/schemas/user'
import { TypeORMRepository } from '@/infra/repository/postgres/repository'
import { ConvertTypeOrmFilter, SearchTypeEnum, ValidateDatabaseSortAllowed } from '@/utils/decorators'

@Injectable()
export class UserRepository extends TypeORMRepository<Model> implements IUserRepository {
  constructor(readonly repository: Repository<Model>) {
    super(repository)
  }

  @ConvertTypeOrmFilter<UserEntity>([
    { name: 'email', type: SearchTypeEnum.equal },
    { name: 'name', type: SearchTypeEnum.like }
  ])
  @ValidateDatabaseSortAllowed<UserEntity>({ name: 'email' }, { name: 'name' }, { name: 'createdAt' })
  async paginate(input: UserListInput): Promise<UserListOutput> {
    const docs = await this.applyPagination(input)
    return {
      ...docs,
      docs: docs.docs.map((doc: UserEntity) => new UserEntity(doc).toObject())
    }
  }
}

type Model = UserSchema & UserEntity
