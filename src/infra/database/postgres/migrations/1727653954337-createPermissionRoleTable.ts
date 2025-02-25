import { MigrationInterface, QueryRunner } from 'typeorm';

export class createPermissionRoleTable1727653954337 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "permissions_roles" ("roles_id" uuid NOT NULL, "permissions_id" uuid NOT NULL, CONSTRAINT "PK_4e9d6f04b532a4d1f8da11505f4" PRIMARY KEY ("roles_id", "permissions_id"))`
    );
    await queryRunner.query(`CREATE INDEX "IDX_982f19c6e0628e9d5ba8132ec6" ON "permissions_roles" ("roles_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_f1c8ff871433d51c817a17234d" ON "permissions_roles" ("permissions_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('permissions_roles', 'IDX_982f19c6e0628e9d5ba8132ec6');
    await queryRunner.dropIndex('permissions_roles', 'IDX_f1c8ff871433d51c817a17234d');
    await queryRunner.dropTable('permissions_roles', true);
  }
}
