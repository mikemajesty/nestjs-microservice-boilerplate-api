import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCOntraintsToPermissionsRole1718294246477 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "permissions_roles" DROP CONSTRAINT "FK_6ea6170bc3bf90e07bd73f0df2a"`);
    await queryRunner.query(`ALTER TABLE "permissions_roles" DROP CONSTRAINT "FK_377989f7d7d066e5d0441514f5a"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6ea6170bc3bf90e07bd73f0df2"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_377989f7d7d066e5d0441514f5"`);
    await queryRunner.query(`CREATE INDEX "IDX_982f19c6e0628e9d5ba8132ec6" ON "permissions_roles" ("roles_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_f1c8ff871433d51c817a17234d" ON "permissions_roles" ("permissions_id")`);
    await queryRunner.query(
      `ALTER TABLE "permissions_roles" ADD CONSTRAINT "FK_982f19c6e0628e9d5ba8132ec67" FOREIGN KEY ("roles_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`
    );
    await queryRunner.query(
      `ALTER TABLE "permissions_roles" ADD CONSTRAINT "FK_f1c8ff871433d51c817a17234de" FOREIGN KEY ("permissions_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "permissions_roles" DROP CONSTRAINT "FK_982f19c6e0628e9d5ba8132ec67"`);
    await queryRunner.query(`ALTER TABLE "permissions_roles" DROP CONSTRAINT "FK_f1c8ff871433d51c817a17234de"`);
  }
}
