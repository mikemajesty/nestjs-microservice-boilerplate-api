import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';
import path from 'path';
import { createClient, RedisClientType } from 'redis';
import request from 'supertest';
import { DataSource, DataSourceOptions, Repository } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

import { UserEntity } from '@/core/user/entity/user';
import { IUserRepository } from '@/core/user/repository/user';
import { ICacheAdapter } from '@/infra/cache';
import { RedisService } from '@/infra/cache/redis';
import { PostgresService } from '@/infra/database/postgres';
import { PermissionSchema } from '@/infra/database/postgres/schemas/permission';
import { RoleSchema } from '@/infra/database/postgres/schemas/role';
import { UserSchema } from '@/infra/database/postgres/schemas/user';
import { UserPasswordSchema } from '@/infra/database/postgres/schemas/user-password';
import { ILoggerAdapter, LoggerModule } from '@/infra/logger';

import { UserModule } from '../module';
import { UserRepository } from '../repository';

describe('User', () => {
  let app: INestApplication;

  let redisContainer: StartedRedisContainer;
  let postgresContainer: StartedPostgreSqlContainer;

  beforeAll(async () => {
    const postgres = new PostgreSqlContainer();
    postgres.withDatabase('nestjs-microservice');

    postgresContainer = await postgres.start();
    redisContainer = await new RedisContainer().start();

    const moduleRef = await Test.createTestingModule({
      imports: [
        UserModule,
        LoggerModule,
        TypeOrmModule.forRootAsync({
          useFactory: () => {
            const conn = new PostgresService().getConnection({ URI: postgresContainer.getConnectionUri() });
            return {
              ...conn,
              timeout: 5000,
              connectTimeout: 5000,
              logging: false,
              migrationsRun: true,
              migrate: true,
              migrations: [path.join(__dirname, '../../../infra/database/postgres/migrations/*.{ts,js}')],
              autoLoadEntities: true,
              namingStrategy: new SnakeNamingStrategy(),
              entities: [RoleSchema, PermissionSchema, UserPasswordSchema, UserSchema]
            };
          },
          async dataSourceFactory(options) {
            const dataSource = new DataSource(options as DataSourceOptions);
            const source = await dataSource.initialize();
            return source;
          }
        })
      ]
    })
      .overrideProvider(IUserRepository)
      .useFactory({
        factory(repository: Repository<UserSchema & UserEntity>) {
          {
            return new UserRepository(repository);
          }
        },
        inject: [getRepositoryToken(UserSchema)]
      })
      .overrideProvider(ICacheAdapter)
      .useFactory({
        async factory(logger: ILoggerAdapter): Promise<RedisService> {
          const client = createClient({ url: redisContainer.getConnectionUrl() }) as RedisClientType;
          await client.connect();
          const conn = new RedisService(logger, client);
          return conn;
        },
        inject: [ILoggerAdapter]
      })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });
  it(`/GET /v1/users`, async () => {
    return request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${process.env.TOKEN_TEST}`)
      .expect(200);
  });

  afterAll(async () => {
    await postgresContainer.stop();
    await app.close();
  });
});
