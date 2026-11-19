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
import { CacheMemoryService } from '@/infra/cache/memory'
import { MongoConnectionName } from '@/infra/database'
import { MongoDatabaseModule } from '@/infra/database/mongo'
import { ISecretsAdapter } from '@/infra/secrets'
import { EnvEnum } from '@/infra/secrets/types'
import { GuardsModule } from '@/middlewares/guards/module'
import { TestUtils } from '@/utils/test'
import { TestEnd2EndUtils, TestMongoContainer, TestPostgresContainer, TestRedisContainer } from '@/utils/test/e2e'

import { HealthController } from '../controller'
import { IHealthAdapter, IHealthCacheAdapter } from '../interfaces'
import { HealthModule } from '../module'
import { HealthService } from '../service'
import { HealthStatus } from '../types'

describe(HealthController.name, () => {
  let app: Awaited<ReturnType<typeof TestEnd2EndUtils.createApp>>
  let redisService: ICacheAdapter<Redis>
  let service: HealthService
  let healthCache: CacheMemoryService

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
    service = moduleRef.get(IHealthAdapter) as HealthService
    healthCache = moduleRef.get(IHealthCacheAdapter) as CacheMemoryService
  })

  beforeEach(() => {
    healthCache.client.flushAll()
  })

  afterEach(() => {
    TestUtils.restoreMocks()
  })

  afterAll(async () => {
    await app.close()
    await mongoContainer.close()
    await redisContainer.close()
    await postgresContainer.close()
  })

  describe('micro-cache', () => {
    const http = () => request(app.getHttpServer())

    it('/GET /health/metrics twice within the TTL should reuse the same collection', async () => {
      const first = await http().get('/health/metrics').expect(200)
      const second = await http().get('/health/metrics').expect(200)

      expect(second.body.timestamp).toBe(first.body.timestamp)
      expect(second.body.window).toEqual(first.body.window)
    })

    it('/GET /health/metrics called concurrently should collect once (single flight)', async () => {
      const collections = TestUtils.spyOn(service, 'getRuntimeWindow')

      const responses = await Promise.all(Array.from({ length: 10 }, () => http().get('/health/metrics').expect(200)))

      expect(collections).toHaveBeenCalledTimes(1)
      expect(new Set(responses.map((response) => response.body.timestamp)).size).toBe(1)
    })

    it('/GET /health/ready and /health/startup should share the same dependency checks', async () => {
      const mongoChecks = TestUtils.spyOn(service, 'checkMongo')

      await Promise.all([http().get('/health/ready').expect(200), http().get('/health/startup').expect(200)])
      await http().get('/health/ready').expect(200)

      expect(mongoChecks).toHaveBeenCalledTimes(1)
    })

    it('/GET /health/ready within the TTL should keep checkedAt while timestamp follows each request', async () => {
      const first = await http().get('/health/ready').expect(200)
      await new Promise((resolve) => setTimeout(resolve, 20))
      const second = await http().get('/health/ready').expect(200)

      expect(second.body.checkedAt).toBe(first.body.checkedAt)
      expect(second.body.timestamp).not.toBe(first.body.timestamp)
      expect(second.body.dependencies).toEqual(first.body.dependencies)
    })

    it('/GET /health/ready after the TTL should check the dependencies again', async () => {
      const mongoChecks = TestUtils.spyOn(service, 'checkMongo')

      await http().get('/health/ready').expect(200)
      await http().get('/health/ready').expect(200)
      expect(mongoChecks).toHaveBeenCalledTimes(1)

      await new Promise((resolve) => setTimeout(resolve, 2_100))
      await http().get('/health/ready').expect(200)

      expect(mongoChecks).toHaveBeenCalledTimes(2)
    })
  })

  it('/GET /health/ready should report each dependency with its latency', async () => {
    const response = await request(app.getHttpServer()).get('/health/ready').expect(200)

    const check = { status: HealthStatus.UP, latencyMs: expect.any(Number) }
    expect(response.body).toEqual({
      status: HealthStatus.UP,
      version: expect.any(String),
      timestamp: expect.any(String),
      checkedAt: expect.any(String),
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
    expect(body.memory.v8).toMatchObject({ totalHeapSize: mb, heapSizeLimit: mb })
    expect(body.memory.v8).not.toHaveProperty('usedHeapSize')
    expect(body.memory.container).toHaveProperty('limit')
    expect(body.memory.heapSpaces.length).toBeGreaterThan(0)

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
