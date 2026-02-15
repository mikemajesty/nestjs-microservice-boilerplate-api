import { DataSource, EntityManager } from 'typeorm'

import { PermissionEntity } from '@/core/permission/entity/permission'
import { RoleEntity } from '@/core/role/entity/role'
import { IRoleRepository } from '@/core/role/repository/role'
import { PermissionSchema } from '@/infra/database/postgres/schemas/permission'
import { IRepository, RunInTransactionType } from '@/infra/repository'
import { PermissionModel } from '@/modules/permission/repository'
import { IDGeneratorUtils } from '@/utils/id-generator'

import { TestEnd2EndUtils } from '../utils'
import { TestFixture } from './adpater'

export class PermissionFixture implements Omit<TestFixture<PermissionEntity>, 'override'> {
  entity: PermissionEntity[] = []

  constructor() {
    for (const permission of TestEnd2EndUtils.ALL_PERMISSIONS) {
      this.entity.push(new PermissionEntity({ id: IDGeneratorUtils.uuid(), name: permission.name }))
    }
  }

  async removeRole(permission: PermissionEntity, role: RoleEntity[], roleRepository: IRoleRepository) {
    await roleRepository.runInTransaction(async (context: RunInTransactionType) => {
      const ctx = context as EntityManager
      for (const r of role) {
        await ctx.createQueryBuilder().relation(PermissionSchema, 'roles').of(permission.id).remove(r.id)
      }
    })
  }

  async clear(manager: DataSource): Promise<void> {
    const dataSource = await manager.initialize()
    const entities = dataSource.entityMetadatas.filter((e) => e.name === PermissionEntity.name)
    for (const entity of entities) {
      const repository = dataSource.getRepository(entity.name)
      await repository.query(`TRUNCATE TABLE \"${entity.tableName}\" RESTART IDENTITY CASCADE;`)
    }
  }

  async up(repository: IRepository<PermissionEntity>): Promise<void> {
    await repository.runInTransaction(async (context: RunInTransactionType) => {
      const ctx = context as EntityManager
      for (const permission of this.entity) {
        const exists = await ctx.findOne(PermissionSchema, { where: { name: permission.name } })
        if (exists) continue
        await ctx.save(PermissionSchema, permission as PermissionModel)
      }
    })
  }

  async down(repository: IRepository<PermissionEntity>): Promise<void> {
    await repository.runInTransaction(async (context: RunInTransactionType) => {
      const ctx = context as EntityManager
      await ctx.deleteAll(PermissionSchema)
    })
  }
}
