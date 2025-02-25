import { MongoDBContainer, StartedMongoDBContainer } from '@testcontainers/mongodb';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';
import mongoose from 'mongoose';
import path from 'path';
import { createClient, RedisClientType } from 'redis';
import { DataSource, DataSourceOptions } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

import { RedisService } from '@/infra/cache/redis';
import { ConnectionName } from '@/infra/database/enum';
import { PostgresService } from '@/infra/database/postgres';
import { ILoggerAdapter } from '@/infra/logger';

export class TestMongoContainer {
  mongoContainer!: StartedMongoDBContainer;

  getTestMongo = async (conectionName: ConnectionName): Promise<{ mongoConnection: mongoose.Connection }> => {
    this.mongoContainer = await new MongoDBContainer('mongo:6.0.1').start();

    const mongo: mongoose.Connection = mongoose
      .createConnection(this.mongoContainer.getConnectionString(), { directConnection: true, appName: conectionName })
      .useDb('nestjs-microservice');
    return { mongoConnection: mongo };
  };

  async close() {
    await this.mongoContainer.stop();
  }
}

export class TestPostgresContainer {
  postgresContainer!: StartedPostgreSqlContainer;

  getTestPostgres = async (): Promise<StartedPostgreSqlContainer> => {
    const postgres = new PostgreSqlContainer();
    postgres.withDatabase('nestjs-microservice');

    this.postgresContainer = await postgres.start();

    return this.postgresContainer;
  };

  async getDataSource(options: DataSourceOptions | undefined) {
    const dataSource = new DataSource(options as DataSourceOptions);
    const source = await dataSource.initialize();
    return source;
  }

  getConfiguration = (postgresConection: StartedPostgreSqlContainer, pathname: string) => {
    const conn = new PostgresService().getConnection({ URI: postgresConection.getConnectionUri() });
    return {
      ...conn,
      timeout: 5000,
      connectTimeout: 5000,
      logging: false,
      migrationsRun: true,
      migrate: true,
      migrations: [path.join(pathname, '../../../infra/database/postgres/migrations/*.{ts,js}')],
      autoLoadEntities: true,
      namingStrategy: new SnakeNamingStrategy(),
      entities: [path.join(pathname, '../../../infra/database/postgres/schemas/*.{ts,js}')]
    };
  };

  async close() {
    await this.postgresContainer.stop();
  }
}

export class TestRedisContainer {
  redisContainer!: StartedRedisContainer;
  client!: RedisClientType;

  getTestRedis = async (): Promise<RedisService> => {
    const logger: ILoggerAdapter = { error: console.error, log: console.log } as ILoggerAdapter;
    this.redisContainer = await new RedisContainer().start();
    this.client = createClient({ url: this.redisContainer.getConnectionUrl() }) as RedisClientType;
    await this.client.connect();
    const conn = new RedisService(logger, this.client);
    return conn;
  };

  async close() {
    await this.client.disconnect();
    await this.redisContainer.stop();
  }
}
