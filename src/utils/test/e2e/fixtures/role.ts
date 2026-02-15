import { DataSource, EntityManager, FindOptionsWhere } from 'typeorm'

import { PermissionEntity } from '@/core/permission/entity/permission'
import { RoleEntity, RoleEnum } from '@/core/role/entity/role'
import { RoleSchema } from '@/infra/database/postgres/schemas/role'
import { IRepository, RunInTransactionType } from '@/infra/repository'
import { RoleModel } from '@/modules/role/repository'
import { IDGeneratorUtils } from '@/utils/id-generator'

import { TestFixture } from './adpater'

export class RoleFixture implements Omit<TestFixture<RoleEntity>, 'override'> {
  entity: RoleEntity[] = []

  constructor() {
    for (const role of Object.values(RoleEnum)) {
      this.entity.push(new RoleEntity({ id: IDGeneratorUtils.uuid(), name: role }))
    }
  }

  async clear(manager: DataSource): Promise<void> {
    const dataSource = await manager.initialize()
    const entities = dataSource.entityMetadatas.filter((e) => e.name === RoleEntity.name)
    for (const entity of entities) {
      const repository = dataSource.getRepository(entity.name)
      await repository.query(`TRUNCATE TABLE \"${entity.tableName}\" RESTART IDENTITY CASCADE;`)
    }
  }

  addPermissions(role: RoleEntity, permissions: PermissionEntity[]): void {
    role.permissions = role.permissions.concat(permissions)
  }

  async up(repository: IRepository<RoleEntity>): Promise<void> {
    await repository.runInTransaction(async (context: RunInTransactionType) => {
      const ctx = context as EntityManager
      for (const role of this.entity) {
        const exists = await ctx.findOne(RoleSchema, { where: { name: role.name } as FindOptionsWhere<RoleSchema> })
        if (exists) continue
        await ctx.save(RoleSchema, role.toObject() as RoleModel)
      }
    })
  }

  async down(repository: IRepository<RoleEntity>): Promise<void> {
    await repository.runInTransaction(async (context: RunInTransactionType) => {
      const ctx = context as EntityManager
      await ctx.deleteAll(RoleSchema)
    })
  }
}
