import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersPasswordTable1717769593778 implements MigrationInterface {
  name?: string;
  transaction?: boolean;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "users_password" ("id" uuid NOT NULL, "password" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_4175c832d328c98ebafbc82aa95" PRIMARY KEY ("id"));`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users_password', true);
  }
}
