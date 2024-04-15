import { MigrationInterface } from 'mongo-migrate-ts';
import { Db } from 'mongodb';

export class CreateUserCollection1709943706267 implements MigrationInterface {
  async up(db: Db): Promise<void> {
    await db.createCollection('users');
  }

  async down(db: Db): Promise<void> {
    await db.dropCollection('users');
  }
}
