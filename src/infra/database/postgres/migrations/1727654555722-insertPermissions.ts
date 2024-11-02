import { PermissionEntity } from '@/core/permission/entity/permission';
import { UUIDUtils } from '@/utils/uuid';
import { MigrationInterface, QueryRunner } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { PermissionSchema } from '../schemas/permission';

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
];
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
];

export class insertPermissions1727654555722 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const permissionsPromises = [];
    for (const permission of userPermissions.concat(backofficePermissions)) {
      const entity = new PermissionEntity({ id: UUIDUtils.create(), name: permission });
      permissionsPromises.push(
        queryRunner.manager.insert(PermissionSchema, entity as QueryDeepPartialEntity<PermissionSchema>)
      );
    }

    await Promise.all(permissionsPromises);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.manager.remove(PermissionSchema);
  }
}
