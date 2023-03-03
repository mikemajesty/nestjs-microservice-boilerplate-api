import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDatabase1677346779952 implements MigrationInterface {
  transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`create database "nestjs-microservice";`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`drop database "nestjs-microservice";`);
  }
}
