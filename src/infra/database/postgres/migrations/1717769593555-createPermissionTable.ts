import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePermissionTable1717769593555 implements MigrationInterface {
  name?: string;
  transaction?: boolean;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "permissions" ("id" uuid NOT NULL, "name" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY ("id"));`
    );
    await queryRunner.query(
      `ALTER TABLE "permissions" ADD CONSTRAINT "UQ_48ce552495d14eae9b187bb6716" UNIQUE ("name")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('permissions', true);
    await queryRunner.query(`ALTER TABLE "permissions" DROP CONSTRAINT "UQ_48ce552495d14eae9b187bb6716"`);
  }
}
