import { Db, MongoClient } from 'mongodb'
import { MigrationInterface } from 'mongo-migrate-ts';
import { UserRole } from '@/core/user/entity/user';

export class CreateUserDefault1709944044583 implements MigrationInterface {
  public async up(db: Db, client: MongoClient): Promise<void> {
    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        await db.collection('user-collection').insertOne({
          id: `b23fd7b8-b1eb-44df-b99e-297bf346e88e`,
          login: 'admin',
          //sha256
          password: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
          roles: [UserRole.BACKOFFICE, UserRole.USER]
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
        await db.collection('user-collection').deleteOne({ login: 'admin' });
      });
    } finally {
      await session.endSession();
    }
  }
}
