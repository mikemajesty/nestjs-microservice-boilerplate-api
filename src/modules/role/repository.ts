/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/modules/repository.md
 */
import { Injectable } from '@nestjs/common'
import { Repository } from 'typeorm'

import { RoleEntity } from '@/core/role/entity/role'
import { IRoleRepository } from '@/core/role/repository/role'
import { RoleListInput, RoleListOutput } from '@/core/role/use-cases/role-list'
import { RoleSchema } from '@/infra/database/postgres/schemas/role'
import { TypeORMRepository } from '@/infra/repository/postgres/repository'
import { ConvertTypeOrmFilter, SearchTypeEnum, ValidateDatabaseSortAllowed } from '@/utils/decorators'

@Injectable()
export class RoleRepository extends TypeORMRepository<Model> implements IRoleRepository {
  constructor(readonly repository: Repository<Model>) {
    super(repository)
  }

  @ConvertTypeOrmFilter<RoleEntity>([{ name: 'name', type: SearchTypeEnum.like }])
  @ValidateDatabaseSortAllowed<RoleEntity>({ name: 'name' }, { name: 'createdAt' })
  async paginate(input: RoleListInput): Promise<RoleListOutput> {
    const docs = await this.applyPagination(input)
    return { ...docs, docs: docs.docs.map((doc) => new RoleEntity(doc).toObject()) }
  }
}

type Model = RoleSchema & RoleEntity
