import { PermissionEntity } from '@/core/permission/entity/permission'
import { RoleEntity, RoleEnum } from '@/core/role/entity/role'
import { RoleSchema } from '@/infra/database/postgres/schemas/role'
import { IRepository } from '@/infra/repository'
import { IDGeneratorUtils } from '@/utils/id-generator'

import { ITestFixture } from './adpater'
import { DatabaseFixture } from './database-fixture'

export class RoleFixture extends DatabaseFixture<RoleSchema> implements Omit<ITestFixture<RoleEntity>, 'override'> {
  entity: RoleEntity[] = []

  constructor() {
    super(RoleSchema)
    for (const role of Object.values(RoleEnum)) {
      this.entity.push(new RoleEntity({ id: IDGeneratorUtils.uuid(), name: role }))
    }
  }

  addPermissions(role: RoleEntity, permissions: PermissionEntity[]): void {
    permissions.forEach((permission) => role.addPermission(permission))
  }

  async up(repository: IRepository<RoleEntity>): Promise<void> {
    await this.insertIfNotExists({
      repository,
      entities: this.entity,
      where: (role) => ({ name: role.name as RoleEnum })
    })
  }

  async down(repository: IRepository<RoleEntity>): Promise<void> {
    await this.deleteAllRows(repository)
  }
}
