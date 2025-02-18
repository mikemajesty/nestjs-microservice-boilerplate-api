import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import mongoose, { PaginateModel, Schema } from 'mongoose';
import request from 'supertest';
import { TestMongoContainer, TestRedisContainer } from 'test/containers';
import { TestMock } from 'test/mock';

import { CatEntity } from '@/core/cat/entity/cat';
import { ICatRepository } from '@/core/cat/repository/cat';
import { ICacheAdapter } from '@/infra/cache';
import { RedisService } from '@/infra/cache/redis';
import { ConnectionName } from '@/infra/database/enum';
import { Cat, CatDocument, CatSchema } from '@/infra/database/mongo/schemas/cat';

import { CatModule } from '../module';
import { CatRepository } from '../repository';

describe('Cats', () => {
  let app: INestApplication;
  let repository: ICatRepository;

  const containerMongo = new TestMongoContainer();
  const containerRedis = new TestRedisContainer();

  beforeAll(async () => {
    const { mongoConnection } = await containerMongo.getTestMongo(ConnectionName.CATS);

    const moduleRef = await Test.createTestingModule({
      imports: [CatModule]
    })
      .overrideProvider(ICatRepository)
      .useFactory({
        factory() {
          {
            type Model = mongoose.PaginateModel<CatDocument>;

            const repository: PaginateModel<CatDocument> = mongoConnection.model<CatDocument, Model>(
              Cat.name,
              CatSchema as Schema
            );
            return new CatRepository(repository);
          }
        }
      })
      .overrideProvider(ICacheAdapter)
      .useFactory({
        async factory(): Promise<RedisService> {
          const redis = await containerRedis.getTestRedis();
          return redis;
        },
        inject: []
      })
      .compile();

    app = moduleRef.createNestApplication();
    repository = app.get(ICatRepository);
    await app.init();
  });

  it(`/GET /v1/cats`, async () => {
    await repository.create(new CatEntity({ id: TestMock.getMockUUID(), name: 'Miau', age: 10, breed: 'siamese' }));

    return request(app.getHttpServer())
      .get('/cats')
      .set('Authorization', `Bearer ${process.env.TOKEN_TEST}`)
      .expect(200);
  });

  afterAll(async () => {
    await containerMongo.close();
    await containerRedis.close();
    await app.close();
  });
});
