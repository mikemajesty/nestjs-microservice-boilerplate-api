import { MigrationInterface, QueryRunner } from 'typeorm';

export class createTableCats1679532974085 implements MigrationInterface {
  transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS public.cats (
            id uuid NOT NULL,
            "name" text NOT NULL,
            breed text NOT NULL,
            age int4 NOT NULL,
            "createdAt" timestamp NOT NULL DEFAULT now(),
            "updatedAt" timestamp NOT NULL DEFAULT now(),
            "deletedAt" timestamp NULL,
            CONSTRAINT "PK_611e3c0a930b4ddc1541422864c" PRIMARY KEY (id)
        );`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS public.cats;`);
  }
}
