import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRoleIdToUserTable1717773444118 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_a2cecd1a3531c0b041e29ba46e1" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP CONSTRAINT FK_a2cecd1a3531c0b041e29ba46e1;');
  }
}
