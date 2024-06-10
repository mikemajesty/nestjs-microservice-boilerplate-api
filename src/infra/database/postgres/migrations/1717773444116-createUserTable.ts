import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1717773444116 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE users_roles_enum AS ENUM ('USER', 'BACKOFFICE');`);
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL, "name" text NOT NULL, "email" text NOT NULL, "roles" "public"."users_roles_enum" array NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "password_id" uuid, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "REL_4175c832d328c98ebafbc82aa9" UNIQUE ("password_id"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_4175c832d328c98ebafbc82aa95" FOREIGN KEY ("password_id") REFERENCES "users_password"("id") ON DELETE NO ACTION ON UPDATE CASCADE`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users', true);
    await queryRunner.query('DROP TYPE users_roles_enum;');
    await queryRunner.query('DROP CONSTRAINT FK_4175c832d328c98ebafbc82aa95;');
  }
}
