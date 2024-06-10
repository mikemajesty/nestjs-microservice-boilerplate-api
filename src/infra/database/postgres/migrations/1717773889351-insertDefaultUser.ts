import { UserEntity, UserRoleEnum } from '@/core/user/entity/user';
import { UserPasswordEntity } from '@/core/user/entity/user-password';
import { MigrationInterface, QueryRunner } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { UserSchema } from '../schemas/user';
import { UserPasswordSchema } from '../schemas/userPassword';

export class InsertDefaultUser1717773889351 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const password = new UserPasswordEntity({
      password: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'
    });

    const entity = new UserEntity({ email: 'admin@admin.com', name: 'Admin', roles: Object.values(UserRoleEnum) });

    await queryRunner.manager.insert(UserPasswordSchema, password as QueryDeepPartialEntity<UserPasswordSchema>);
    entity.password = password;
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
