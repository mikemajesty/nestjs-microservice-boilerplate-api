import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { MongoDBContainer, StartedMongoDBContainer } from '@testcontainers/mongodb';
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';
import mongoose, { PaginateModel, Schema } from 'mongoose';
import { createClient, RedisClientType } from 'redis';
import request from 'supertest';

import { CatEntity } from '@/core/cat/entity/cat';
import { ICatRepository } from '@/core/cat/repository/cat';
import { ICacheAdapter } from '@/infra/cache';
import { RedisService } from '@/infra/cache/redis';
import { ConnectionName } from '@/infra/database/enum';
import { Cat, CatDocument, CatSchema } from '@/infra/database/mongo/schemas/cat';
import { ILoggerAdapter, LoggerModule } from '@/infra/logger';
import { TestUtils } from '@/utils/tests';

import { CatModule } from '../module';
import { CatRepository } from '../repository';

describe('Cats', () => {
  let app: INestApplication;
  let repository: ICatRepository;

  let redisContainer: StartedRedisContainer;
  let mongoContainer: StartedMongoDBContainer;

  beforeAll(async () => {
    mongoContainer = await new MongoDBContainer('mongo:6.0.1').start();
    redisContainer = await new RedisContainer().start();

    const mongo: mongoose.Connection = mongoose
      .createConnection(mongoContainer.getConnectionString(), { directConnection: true, appName: ConnectionName.CATS })
      .useDb('nestjs-microservice');

    const moduleRef = await Test.createTestingModule({
      imports: [CatModule, LoggerModule]
    })
      .overrideProvider(ICatRepository)
      .useFactory({
        factory() {
          {
            type Model = mongoose.PaginateModel<CatDocument>;

            const repository: PaginateModel<CatDocument> = mongo.model<CatDocument, Model>(
              Cat.name,
              CatSchema as Schema
            );
            return new CatRepository(repository);
          }
        }
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
    repository = app.get(ICatRepository);
    await app.init();
  });

  it(`/GET /v1/cats`, async () => {
    await repository.create(new CatEntity({ id: TestUtils.getMockUUID(), name: 'Miau', age: 10, breed: 'siamese' }));

    return request(app.getHttpServer())
      .get('/cats')
      .set('Authorization', `Bearer ${process.env.TOKEN_TEST}`)
      .expect(200);
  });

  afterAll(async () => {
    await mongoContainer.stop();
    await app.close();
  });
});
