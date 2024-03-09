import { MigrationInterface } from 'mongo-migrate-ts';
import { Db } from 'mongodb';

export class CreateUserCollection1709943706267 implements MigrationInterface {
  async up(db: Db): Promise<any> {
    await db.createCollection('user-collection');
  }

  async down(db: Db): Promise<any> {
    await db.dropCollection('user-collection');
  }
}
