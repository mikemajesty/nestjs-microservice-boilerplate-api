import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddPerformanceIndexes1734199200000 implements MigrationInterface {
  transaction?: boolean | undefined
  down(queryRunner: QueryRunner): Promise<any> {
    throw new Error('Method not implemented.')
  }
  name = AddPerformanceIndexes1734199200000.name

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`)
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS unaccent`)

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_users_name_trgm" 
      ON "users" USING gin (name gin_trgm_ops)
    `)

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_users_name_lower" 
      ON "users" (lower(name)) 
      WHERE "deleted_at" IS NULL
    `)

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_roles_name_trgm" 
      ON "roles" USING gin (name gin_trgm_ops)
    `)

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_roles_name_lower" 
      ON "roles" (lower(name)) 
      WHERE "deleted_at" IS NULL
    `)

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_permissions_name_trgm" 
      ON "permissions" USING gin (name gin_trgm_ops)
    `)


    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_users_roles_role_id" 
      ON "users_roles" ("roles_id")
    `)

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_permissions_roles_permission_id" 
      ON "permissions_roles" ("permissions_id")
    `)

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_permissions_roles_role_id" 
      ON "permissions_roles" ("roles_id")
    `)

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_users_deleted_name_created" 
      ON "users" ("deleted_at", "name", "created_at")
    `)

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_users_deleted_created_id" 
      ON "users" ("deleted_at", "created_at", "id")
    `)

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_roles_deleted_name_created" 
      ON "roles" ("deleted_at", "name", "created_at")
    `)

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_roles_deleted_created_id" 
      ON "roles" ("deleted_at", "created_at", "id")
    `)

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_permissions_deleted_name_created" 
      ON "permissions" ("deleted_at", "name", "created_at")
    `)

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_users_active_all" 
      ON "users" ("id", "name", "email", "created_at") 
      WHERE "deleted_at" IS NULL
    `)

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_roles_active_name" 
      ON "roles" ("name", "id", "created_at") 
      WHERE "deleted_at" IS NULL
    `)

    await queryRunner.query(`ANALYZE users`)
    await queryRunner.query(`ANALYZE roles`)
    await queryRunner.query(`ANALYZE permissions`)
    await queryRunner.query(`ANALYZE users_roles`)
    await queryRunner.query(`ANALYZE permissions_roles`)
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_permissions_deleted_name_created"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_roles_deleted_created_id"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_roles_deleted_name_created"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_users_deleted_created_id"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_users_deleted_name_created"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_permissions_roles_role_id"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_permissions_roles_permission_id"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_users_roles_role_id"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_users_roles_user_id"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_permissions_name_trgm"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_roles_name_lower"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_roles_name_trgm"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_users_name_lower"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_users_name_trgm"`)
  }
}