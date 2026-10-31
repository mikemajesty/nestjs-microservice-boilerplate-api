import { EntityManager } from 'typeorm'

import { PermissionEntity } from '@/core/permission/entity/permission'
import { RoleEntity } from '@/core/role/entity/role'
import { IRoleRepository } from '@/core/role/repository/role'
import { PermissionSchema } from '@/infra/database/postgres/schemas/permission'
import { IRepository, RunInTransactionType } from '@/infra/repository'
import { IDGeneratorUtils } from '@/utils/id-generator'

import { TestEnd2EndUtils } from '../utils'
import { ITestFixture } from './adpater'
import { DatabaseFixture } from './database-fixture'

export class PermissionFixture
  extends DatabaseFixture<PermissionSchema>
  implements Omit<ITestFixture<PermissionEntity>, 'override'>
{
  entity: PermissionEntity[] = []

  constructor() {
    super(PermissionSchema)
    for (const permission of TestEnd2EndUtils.ALL_PERMISSIONS) {
      this.entity.push(new PermissionEntity({ id: IDGeneratorUtils.uuid(), name: permission.name }))
    }
  }

  async removeRole(permission: PermissionEntity, roles: RoleEntity[], roleRepository: IRoleRepository) {
    await roleRepository.runInTransaction(async (context: RunInTransactionType) => {
      const ctx = context as EntityManager
      for (const r of roles) {
        await ctx.createQueryBuilder().relation(PermissionSchema, 'roles').of(permission.id).remove(r.id)
      }
    })
  }

  async up(repository: IRepository<PermissionEntity>): Promise<void> {
    await this.insertIfNotExists({
      repository,
      entities: this.entity,
      where: (permission) => ({ name: permission.name })
    })
  }

  async down(repository: IRepository<PermissionEntity>): Promise<void> {
    await this.deleteAllRows(repository)
  }
}
