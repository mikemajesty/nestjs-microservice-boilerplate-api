import { PermissionEntity } from '@/core/permission/entity/permission'
import { IDGeneratorUtils } from '@/utils/id-generator'
import { MigrationInterface, QueryDeepPartialEntity, QueryRunner } from 'typeorm'
import { PermissionSchema } from '../schemas/permission'

export const userPermissions = [
  'cat:create',
  'cat:update',
  'cat:getbyid',
  'cat:list',
  'cat:delete',
  'user:logout',
  'user:create',
  'user:update',
  'user:list',
  'user:getbyid',
  'user:changepassword',
  'user:delete'
]
export const backofficePermissions = [
  'permission:create',
  'permission:update',
  'permission:getbyid',
  'permission:list',
  'permission:delete',
  'role:create',
  'role:update',
  'role:getbyid',
  'role:list',
  'role:delete',
  'role:addpermission',
  'role:deletepermission'
]

export class insertPermissions1727654555722 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const permission of userPermissions.concat(backofficePermissions)) {
      const entity = new PermissionEntity({ id: IDGeneratorUtils.uuid(), name: permission })
      await queryRunner.manager.insert(PermissionSchema, entity as QueryDeepPartialEntity<PermissionSchema>)
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.manager.remove(PermissionSchema)
  }
}
