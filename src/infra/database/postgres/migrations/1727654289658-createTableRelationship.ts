import { MigrationInterface, QueryRunner } from 'typeorm';

export class createTableRelationship1727654289658 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_4175c832d328c98ebafbc82aa95" FOREIGN KEY ("password_id") REFERENCES "users_password"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "reset_password" ADD CONSTRAINT "FK_de65040d842349a5e6428ff21e6" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "permissions_roles" ADD CONSTRAINT "FK_982f19c6e0628e9d5ba8132ec67" FOREIGN KEY ("roles_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`
    );
    await queryRunner.query(
      `ALTER TABLE "permissions_roles" ADD CONSTRAINT "FK_f1c8ff871433d51c817a17234de" FOREIGN KEY ("permissions_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE`
    );
    await queryRunner.query(
      `ALTER TABLE "users_roles" ADD CONSTRAINT "FK_259b5a2e24d0a5480262a774e46" FOREIGN KEY ("users_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`
    );
    await queryRunner.query(
      `ALTER TABLE "users_roles" ADD CONSTRAINT "FK_ed1bb3304475cfa49b2964aaf27" FOREIGN KEY ("roles_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropCheckConstraint('users', 'FK_4175c832d328c98ebafbc82aa95');
    await queryRunner.dropCheckConstraint('reset_password', 'FK_de65040d842349a5e6428ff21e6');
    await queryRunner.dropCheckConstraint('permissions_roles', 'FK_982f19c6e0628e9d5ba8132ec67');
    await queryRunner.dropCheckConstraint('permissions_roles', 'FK_f1c8ff871433d51c817a17234de');
    await queryRunner.dropCheckConstraint('users_roles', 'FK_259b5a2e24d0a5480262a774e46');
    await queryRunner.dropCheckConstraint('users_roles', 'FK_ed1bb3304475cfa49b2964aaf27');
  }
}
