import { MigrationInterface, QueryRunner } from 'typeorm';

export class createUserRoleTable1727654008041 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "users_roles" ("users_id" uuid NOT NULL, "roles_id" uuid NOT NULL, CONSTRAINT "PK_366245cb19fcd0ca30321644748" PRIMARY KEY ("users_id", "roles_id"))`
    );
    await queryRunner.query(`CREATE INDEX "IDX_259b5a2e24d0a5480262a774e4" ON "users_roles"("users_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_ed1bb3304475cfa49b2964aaf2" ON "users_roles"("roles_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('users_roles', 'IDX_259b5a2e24d0a5480262a774e4');
    await queryRunner.dropIndex('users_roles', 'IDX_ed1bb3304475cfa49b2964aaf2');
    await queryRunner.dropTable('users_roles', true);
  }
}
