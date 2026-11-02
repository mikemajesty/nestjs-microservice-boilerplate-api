/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/modules/repository.md
 */
import { Injectable } from '@nestjs/common'
import { Repository } from 'typeorm'

import { PermissionEntity } from '@/core/permission/entity/permission'
import { IPermissionRepository } from '@/core/permission/repository/permission'
import { PermissionListInput, PermissionListOutput } from '@/core/permission/use-cases/permission-list'
import { PermissionSchema } from '@/infra/database/postgres/schemas/permission'
import { TypeORMRepository } from '@/infra/repository/postgres/repository'
import { SearchTypeEnum, TransformSort,TransformTypeOrmSearch } from '@/utils/decorators'

@Injectable()
export class PermissionRepository
  extends TypeORMRepository<PermissionModel, PermissionEntity>
  implements IPermissionRepository
{
  constructor(readonly repository: Repository<PermissionModel>) {
    super(repository, PermissionEntity)
  }

  @TransformTypeOrmSearch<PermissionEntity>([{ name: 'name', type: SearchTypeEnum.like }])
  @TransformSort<PermissionEntity>({ name: 'name' }, { name: 'createdAt' })
  async paginate(input: PermissionListInput): Promise<PermissionListOutput> {
    return this.applyPagination(input)
  }
}

export type PermissionModel = PermissionSchema & PermissionEntity
