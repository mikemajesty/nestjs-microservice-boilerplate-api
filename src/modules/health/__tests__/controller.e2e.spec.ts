/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/modules/test.md
 */
import { getConnectionToken } from '@nestjs/mongoose'
import { Test } from '@nestjs/testing'
import { Redis } from 'ioredis'
import request from 'supertest'

import { ICacheAdapter } from '@/infra/cache'
import { MongoConnectionName } from '@/infra/database'
import { MongoDatabaseModule } from '@/infra/database/mongo'
import { ISecretsAdapter } from '@/infra/secrets'
import { GuardsModule } from '@/middlewares/guards/module'
import { TestMongoContainer, TestPostgresContainer, TestRedisContainer } from '@/utils/test/e2e/containers'
import { TestEnd2EndUtils } from '@/utils/test/e2e/utils'

import { HealthController } from '../controller'
import { HealthModule } from '../module'
import { HealthStatus } from '../types'

describe(HealthController.name, () => {
  let app: Awaited<ReturnType<typeof TestEnd2EndUtils.createApp>>
  let redisService: ICacheAdapter<Redis>

  const mongoContainer = new TestMongoContainer()
  const postgresContainer = new TestPostgresContainer()
  const redisContainer = new TestRedisContainer()

  beforeAll(async () => {
    const { mongoConnection } = await mongoContainer.getTestMongo()
    await postgresContainer.getPostgres()
    redisService = await redisContainer.getTestRedis()

    const moduleRef = await Test.createTestingModule({
      imports: [HealthModule, MongoDatabaseModule, GuardsModule]
    })
      .overrideProvider(getConnectionToken(MongoConnectionName.MONGO))
      .useValue(mongoConnection)
      .overrideProvider(ICacheAdapter)
      .useValue(redisService)
      .overrideProvider(ISecretsAdapter)
      .useValue({
        IS_DOCUMENTDB: false,
        IS_LOCAL: false,
        IS_PRODUCTION: false,
        MONGO: { MONGO_URL: mongoContainer.mongoContainer.getConnectionString() },
        POSTGRES: { POSTGRES_URL: postgresContainer.postgresContainer.getConnectionUri() },
        REDIS_URL: redisContainer.redisContainer.getConnectionUrl()
      })
      .compile()

    app = await TestEnd2EndUtils.createApp(moduleRef)
  })

  afterAll(async () => {
    await app.close()
    await mongoContainer.close()
    await redisContainer.close()
    await postgresContainer.close()
  })

  it('/GET /health/ready should return live dependency and process data', async () => {
    const response = await request(app.getHttpServer()).get('/health/ready').expect(200)

    expect(response.body.server).toBe(HealthStatus.UP)
    expect(response.body.mongo.status).toBe(HealthStatus.UP)
    expect(response.body.mongo.connection).toMatchObject({
      active: expect.any(Number),
      available: expect.any(Number),
      current: expect.any(Number),
      totalCreated: expect.any(Number)
    })
    expect(response.body.mongo.memory).toMatchObject({
      used: expect.stringMatching(/^\d+\.\d{2} MB$/),
      limit: expect.stringMatching(/^\d+\.\d{2} MB$/)
    })

    expect(response.body.postgres.status).toBe(HealthStatus.UP)
    expect(response.body.postgres.connection).toMatchObject({
      active: expect.any(Number),
      available: expect.any(Number),
      current: expect.any(Number)
    })
    expect(Number(response.body.postgres.databaseSizeBytes)).toBeGreaterThan(0)
    expect(response.body.redisState).toBe(HealthStatus.UP)

    expect(response.body.network).toMatchObject({
      latency: expect.any(String),
      connections: expect.any(Number)
    })
    expect(response.body.memory.process).toMatchObject({
      usedRam: expect.stringMatching(/^\d+\.\d{2} MB$/),
      heapTotal: expect.stringMatching(/^\d+\.\d{2} MB$/),
      heapUsed: expect.stringMatching(/^\d+\.\d{2} MB$/),
      external: expect.stringMatching(/^\d+\.\d{2} MB$/)
    })
    expect(response.body.memory.v8).toMatchObject({
      totalHeapSize: expect.stringMatching(/^\d+\.\d{2} MB$/),
      usedHeapSize: expect.stringMatching(/^\d+\.\d{2} MB$/),
      executableHeapSize: expect.stringMatching(/^\d+\.\d{2} MB$/),
      heapSizeLimit: expect.stringMatching(/^\d+\.\d{2} MB$/)
    })
    expect(response.body.cpu.cpus).toEqual(expect.any(Number))
    expect(response.body.cpu.cores.length).toBeGreaterThan(0)
  })

  it('/GET /health/live should return liveness', async () => {
    const response = await request(app.getHttpServer()).get('/health/live').expect(200)

    expect(response.body).toMatchObject({
      status: HealthStatus.UP,
      timestamp: expect.any(String),
      uptime: expect.any(Number)
    })
  })

  it('/GET /health/startup should report all dependencies as connected', async () => {
    const response = await request(app.getHttpServer()).get('/health/startup').expect(200)

    expect(response.body).toMatchObject({
      status: HealthStatus.UP,
      phase: 'startup',
      connections: {
        mongo: 'connected',
        postgres: 'connected',
        redis: 'connected'
      },
      message: 'All basic connections established'
    })
  })
})
