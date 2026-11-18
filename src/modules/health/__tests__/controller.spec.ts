/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/modules/test.md
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/tests/standards.md
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/tests/containers.md
 */
import { getConnectionToken } from '@nestjs/mongoose'
import { Test } from '@nestjs/testing'
import { Redis } from 'ioredis'
import request from 'supertest'

import { ICacheAdapter } from '@/infra/cache'
import { MongoConnectionName } from '@/infra/database'
import { MongoDatabaseModule } from '@/infra/database/mongo'
import { ISecretsAdapter } from '@/infra/secrets'
import { EnvEnum } from '@/infra/secrets/types'
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
        ENV: EnvEnum.TEST,
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

  it('/GET /health/ready should report each dependency with its latency', async () => {
    const response = await request(app.getHttpServer()).get('/health/ready').expect(200)

    const check = { status: HealthStatus.UP, latencyMs: expect.any(Number) }
    expect(response.body).toEqual({
      status: HealthStatus.UP,
      version: expect.any(String),
      timestamp: expect.any(String),
      dependencies: { mongo: check, postgres: check, redis: check }
    })
  })

  it('/GET /health/metrics should return process, runtime and dependency metrics', async () => {
    const mb = expect.stringMatching(/^\d+\.\d{2} MB$/)
    const response = await request(app.getHttpServer()).get('/health/metrics').expect(200)
    const body = response.body

    expect(body.window.seconds).toBeGreaterThan(0)
    expect(body.process).toMatchObject({
      hostname: expect.any(String),
      pid: expect.any(Number),
      nodeVersion: process.version,
      environment: EnvEnum.TEST,
      cpu: { usagePercent: expect.any(Number), userMs: expect.any(Number), systemMs: expect.any(Number) }
    })

    expect(body.memory.process).toMatchObject({ usedRam: mb, heapTotal: mb, heapUsed: mb, external: mb })
    expect(body.memory.v8).toMatchObject({ totalHeapSize: mb, usedHeapSize: mb, heapSizeLimit: mb })
    expect(body.memory.container).toHaveProperty('limit')
    expect(body.memory.heapSpaces.length).toBeGreaterThan(0)

    // The resolution is subtracted, so an idle loop reports values close to 0, not ~20ms.
    expect(body.eventLoopLag.meanMs).toBeGreaterThanOrEqual(0)
    expect(body.eventLoopLag.meanMs).toBeLessThan(20)
    expect(body.gc).toMatchObject({ count: expect.any(Number), minor: expect.any(Number), major: expect.any(Number) })

    expect(body.cpu.cpus).toEqual(expect.any(Number))
    expect(body.cpu.cores.length).toBeGreaterThan(0)
    expect(body.network.connections).toEqual(expect.any(Number))

    expect(body.mongo.connection).toMatchObject({ active: expect.any(Number), current: expect.any(Number) })
    expect(body.mongo.memory).toMatchObject({ used: mb, limit: mb })
    expect(body.postgres.connection).toMatchObject({
      active: expect.any(Number),
      available: expect.any(Number),
      current: expect.any(Number)
    })
    expect(Number(body.postgres.databaseSizeBytes)).toBeGreaterThan(0)
    expect(body.redis).toMatchObject({ usedMemory: mb, connectedClients: expect.any(Number) })
  })

  it('/GET /health/dashboard should return the HTML panel with a nonce-based CSP', async () => {
    const response = await request(app.getHttpServer()).get('/health/dashboard').expect(200)

    expect(response.headers['content-type']).toMatch(/^text\/html/)
    const nonce = response.headers['content-security-policy']?.match(/'nonce-([^']+)'/)?.[1]
    expect(nonce).toBeDefined()
    expect(response.text).toContain(`<script nonce="${nonce}">`)
    expect(response.text).not.toContain('{{nonce}}')
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
