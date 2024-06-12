import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRolesPermissions1717769593777 implements MigrationInterface {
  name?: string;
  transaction?: boolean;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "permissions_roles" ("permissions_id" uuid NOT NULL, "roles_id" uuid NOT NULL, CONSTRAINT "PK_4cbb20e5703a9b9fc4f02ebca57" PRIMARY KEY ("permissions_id", "roles_id"));`
    );

    await queryRunner.query(`CREATE INDEX "IDX_6ea6170bc3bf90e07bd73f0df2" ON "permissions_roles" ("permissions_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_377989f7d7d066e5d0441514f5" ON "permissions_roles" ("roles_id")`);
    await queryRunner.query(
      `ALTER TABLE "permissions_roles" ADD CONSTRAINT "FK_6ea6170bc3bf90e07bd73f0df2a" FOREIGN KEY ("permissions_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE`
    );
    await queryRunner.query(
      `ALTER TABLE "permissions_roles" ADD CONSTRAINT "FK_377989f7d7d066e5d0441514f5a" FOREIGN KEY ("roles_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('permissions_roles', true);
    await queryRunner.query('DROP CONSTRAINT FK_6ea6170bc3bf90e07bd73f0df2a;');
    await queryRunner.query('DROP CONSTRAINT FK_377989f7d7d066e5d0441514f5a;');
  }
}
