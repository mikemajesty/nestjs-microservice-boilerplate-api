import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateResetPasswordTable1717976911236 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "reset_password" ("id" uuid NOT NULL, "token" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "user_id" uuid, CONSTRAINT "PK_82bffbeb85c5b426956d004a8f5" PRIMARY KEY ("id"))`
    );

    const constraintExists = await queryRunner.query(
      `SELECT true as exists FROM information_schema.table_constraints WHERE constraint_name='FK_de65040d842349a5e6428ff21e6' AND table_name='reset_password';`
    );

    if (!constraintExists) {
      await queryRunner.query(
        `ALTER TABLE "reset_password" ADD CONSTRAINT "FK_de65040d842349a5e6428ff21e6" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('reset_password', true);
    await queryRunner.query('DROP CONSTRAINT FK_de65040d842349a5e6428ff21e6;');
  }
}
