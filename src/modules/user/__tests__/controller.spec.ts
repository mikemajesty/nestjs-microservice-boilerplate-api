/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/main/guides/modules/test.md
 */
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm'
import { PostgreSqlContainer } from '@testcontainers/postgresql'
import request from 'supertest'
import { Repository } from 'typeorm'

import { UserEntity } from '@/core/user/entity/user'
import { IUserRepository } from '@/core/user/repository/user'
import { ICacheAdapter } from '@/infra/cache'
import { RedisService } from '@/infra/cache/redis'
import { UserSchema } from '@/infra/database/postgres/schemas/user'
import { ApiUnprocessableEntityException } from '@/utils/exception'
import { TestPostgresContainer, TestRedisContainer } from '@/utils/test/containers'

import { UserModule } from '../module'
import { UserRepository } from '../repository'

describe('UserController', () => {
  let app: INestApplication

  const redisContainer = new TestRedisContainer()
  const postgresContainer = new TestPostgresContainer()

  beforeAll(async () => {
    const postgres = new PostgreSqlContainer('14.1')
    const database = process.env.POSTGRES_DATABASE
    if (!database) {
      throw new ApiUnprocessableEntityException('POSTGRES_DATABASE env var is not set')
    }
    postgres.withDatabase(database)

    const postgresConection = await postgresContainer.getTestPostgres()

    const moduleRef = await Test.createTestingModule({
      imports: [
        UserModule,
        TypeOrmModule.forRootAsync({
          useFactory: () => {
            return postgresContainer.getConfiguration(postgresConection, __dirname)
          },
          async dataSourceFactory(options) {
            return await postgresContainer.getDataSource(options)
          }
        })
      ]
    })
      .overrideProvider(IUserRepository)
      .useFactory({
        factory(repository: Repository<UserSchema & UserEntity>) {
          {
            return new UserRepository(repository)
          }
        },
        inject: [getRepositoryToken(UserSchema)]
      })
      .overrideProvider(ICacheAdapter)
      .useFactory({
        async factory(): Promise<RedisService> {
          const conn = await redisContainer.getTestRedis()
          return conn
        }
      })
      .compile()

    app = moduleRef.createNestApplication()
    await app.init()
  })
  it(`/GET /v1/users`, async () => {
    return request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${process.env.TOKEN_TEST}`)
      .expect(200)
  })

  afterAll(async () => {
    await postgresContainer.close()
    await redisContainer.close()
    await app.close()
  })
})
