import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddLoginOptimizationIndexes1727670000000 implements MigrationInterface {
  name = AddLoginOptimizationIndexes1727670000000.name

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_users_email_not_deleted" 
      ON "users" ("email") 
      WHERE "deleted_at" IS NULL
    `)

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_users_email_deleted_at" 
      ON "users" ("email", "deleted_at")
    `)

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_users_password_not_deleted" 
      ON "users_password" ("id") 
      WHERE "deleted_at" IS NULL
    `)

    await queryRunner.query(`ANALYZE users`)
    await queryRunner.query(`ANALYZE users_password`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_users_email_not_deleted"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_users_email_deleted_at"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_users_password_not_deleted"`)
  }
}