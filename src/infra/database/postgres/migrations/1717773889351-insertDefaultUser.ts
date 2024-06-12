import { PermissionEntity, PermissionEnum } from '@/core/permission/entity/permission';
import { RoleEntity, RoleEnum } from '@/core/role/entity/role';
import { UserEntity } from '@/core/user/entity/user';
import { UserPasswordEntity } from '@/core/user/entity/user-password';
import { MigrationInterface, QueryRunner } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { PermissionSchema } from '../schemas/permission';
import { RoleSchema } from '../schemas/role';
import { UserSchema } from '../schemas/user';
import { UserPasswordSchema } from '../schemas/userPassword';

export class InsertDefaultUser1717773889351 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const password = new UserPasswordEntity({
      password: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'
    });
    await queryRunner.manager.insert(UserPasswordSchema, password as QueryDeepPartialEntity<UserPasswordSchema>);

    const permission = new PermissionEntity({ name: PermissionEnum.ALL });
    await queryRunner.manager.insert(PermissionSchema, permission as QueryDeepPartialEntity<PermissionSchema>);

    const role = new RoleEntity({ name: RoleEnum.USER });
    await queryRunner.manager.insert(RoleSchema, role as QueryDeepPartialEntity<RoleSchema>);

    await queryRunner.query(
      `INSERT INTO permissions_roles (roles_id, permissions_id) VALUES ('${role.id}', '${permission.id}');`
    );

    const entity = new UserEntity({ email: 'admin@admin.com', name: 'Admin', role });
    entity.password = password;
    entity.role = role;
    await queryRunner.manager.insert(UserSchema, entity as QueryDeepPartialEntity<UserSchema>);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const user = await queryRunner.manager.findOne(UserSchema, {
      where: { email: 'admin@admin.com' },
      relations: { password: true }
    });
    if (user) {
      await queryRunner.manager.delete(UserSchema, { email: 'admin@admin.com' });
    }

    const userPassword = await queryRunner.manager.findOne(UserPasswordSchema, { where: { id: user.password.id } });
    if (userPassword) {
      await queryRunner.manager.delete(UserPasswordSchema, { id: user.password.id });
    }
  }
}
