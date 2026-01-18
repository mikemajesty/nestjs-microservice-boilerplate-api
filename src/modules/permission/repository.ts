/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/modules/repository.md
 */
import { Injectable } from '@nestjs/common'
import { FindOptionsRelations, FindOptionsWhere, Not, Repository } from 'typeorm'

import { PermissionEntity } from '@/core/permission/entity/permission'
import { ExistsOnUpdateInput, IPermissionRepository } from '@/core/permission/repository/permission'
import { PermissionListInput, PermissionListOutput } from '@/core/permission/use-cases/permission-list'
import { PermissionSchema } from '@/infra/database/postgres/schemas/permission'
import { TypeORMRepository } from '@/infra/repository/postgres/repository'
import { ConvertTypeOrmFilter, SearchTypeEnum, ValidateDatabaseSortAllowed } from '@/utils/decorators'

@Injectable()
export class PermissionRepository extends TypeORMRepository<Model> implements IPermissionRepository {
  constructor(readonly repository: Repository<Model>) {
    super(repository)
  }

  async findOneWithRelation(
    filter: Partial<PermissionEntity>,
    relations: { [key in keyof Partial<PermissionEntity>]: boolean }
  ): Promise<PermissionEntity> {
    return (await this.repository.findOne({
      where: filter as FindOptionsWhere<unknown>,
      relations: relations as FindOptionsRelations<unknown>
    })) as PermissionEntity
  }

  async existsOnUpdate(input: ExistsOnUpdateInput): Promise<boolean> {
    return await this.repository.exists({ where: { name: input.nameEquals, id: Not(input.idNotEquals) } })
  }

  @ConvertTypeOrmFilter<PermissionEntity>([{ name: 'name', type: SearchTypeEnum.like }])
  @ValidateDatabaseSortAllowed<PermissionEntity>({ name: 'name' }, { name: 'createdAt' })
  async paginate(input: PermissionListInput): Promise<PermissionListOutput> {
    const permissions = await this.applyPagination(input)

    return {
      ...permissions,
      docs: permissions.docs.map((d) => {
        return new PermissionEntity(d).toObject()
      })
    }
  }
}

type Model = PermissionSchema & PermissionEntity
