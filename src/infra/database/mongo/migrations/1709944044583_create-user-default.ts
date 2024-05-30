import { Db, MongoClient } from 'mongodb';
import { MigrationInterface } from 'mongo-migrate-ts';
import { UserRole } from '@/core/user/entity/user';
import { DateUtils } from '@/utils/date';

export class CreateUserDefault1709944044583 implements MigrationInterface {
  public async up(db: Db, client: MongoClient): Promise<void> {
    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        await db.collection('users').insertOne({
          id: `b23fd7b8-b1eb-44df-b99e-297bf346e88e`,
          email: 'admin@admin.com',
          //sha256
          password: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
          roles: [UserRole.BACKOFFICE, UserRole.USER],
          createdAt: DateUtils.getJSDate(),
          updatedAt: DateUtils.getJSDate()
        });
      });
    } finally {
      await session.endSession();
    }
  }

  public async down(db: Db, client: MongoClient): Promise<void> {
    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        await db.collection('users').deleteOne({ email: 'admin@admin.com' });
      });
    } finally {
      await session.endSession();
    }
  }
}
