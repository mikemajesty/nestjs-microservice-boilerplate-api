import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'

import { IUserRepository } from '@/core/user/repository/user'
import { UserModule } from '@/modules/user/module'
import { TestPostgresContainer, TestRedisContainer } from '@/utils/test/e2e/containers'
import { UserFixture } from '@/utils/test/e2e/fixtures/user'
import { TestEnd2EndUtils } from '@/utils/test/e2e/utils'

import { LoginController } from '../controller'
import { LoginModule } from '../module'

describe(LoginController.name, () => {
  let app: INestApplication
  let userRepository: IUserRepository

  const userFixture = new UserFixture()
  const postgresContainer = new TestPostgresContainer()
  const redisContainer = new TestRedisContainer()

  beforeAll(async () => {
    const { postgresConfig } = await postgresContainer.getPostgres()
    const moduleRef = await Test.createTestingModule({
      imports: [LoginModule, UserModule, TestEnd2EndUtils.getPostgresModule(postgresContainer, postgresConfig)],
      providers: [
        {
          provide: 'ICacheAdapter',
          useFactory: async () => {
            return await redisContainer.getTestRedis()
          }
        }
      ]
    }).compile()

    app = moduleRef.createNestApplication()
    TestEnd2EndUtils.addTracing(app)
    await app.init()

    userRepository = moduleRef.get(IUserRepository)
    await userFixture.down(userRepository)
    await userFixture.up(userRepository)
  })

  afterEach(async () => {
    await userFixture.down(userRepository)
    await userFixture.up(userRepository)
  })

  afterAll(async () => {
    await userFixture.down(userRepository)
    await postgresContainer.close()
    await redisContainer.close()
    await app.close()
  })

  describe('/POST /login', () => {
    it('should login successfully with valid user and password', async () => {
      const res = await request(app.getHttpServer())
        .post('/login')
        .send({ email: userFixture.entity.email, password: 'admin' })
      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty('accessToken')
      expect(typeof res.body.accessToken).toBe('string')
    })

    it('should fail with invalid password', async () => {
      const res = await request(app.getHttpServer())
        .post('/login')
        .send({ email: userFixture.entity.email, password: 'wrongpass' })
      expect([400, 401]).toContain(res.status)
      expect(res.body).toHaveProperty('message')
    })

    it('should fail with non-existent user', async () => {
      const res = await request(app.getHttpServer())
        .post('/login')
        .send({ email: 'notfound@example.com', password: 'admin' })
      expect([400, 401, 404]).toContain(res.status)
      expect(res.body).toHaveProperty('message')
    })
  })
})
