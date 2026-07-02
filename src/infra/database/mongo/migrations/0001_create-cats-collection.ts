import { IMongoMigration } from '@mikemajesty/mongo-migration'
import { Db } from 'mongodb'

export class CreateCatsCollection implements IMongoMigration {
  get version(): string {
    return '0001'
  }

  async up(db: Db): Promise<void> {
    await db.createCollection('cats')
  }

  async down(db: Db): Promise<void> {
    await db.dropCollection('cats')
  }
}
