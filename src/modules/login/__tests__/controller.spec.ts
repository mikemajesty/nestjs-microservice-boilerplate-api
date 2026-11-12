/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/modules/test.md
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/tests/standards.md
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/tests/containers.md
 */
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'

import { IRoleRepository } from '@/core/role/repository/role'
import { IUserRepository } from '@/core/user/repository/user'
import { LoginOutput } from '@/core/user/use-cases/user-login'
import { RefreshTokenOutput } from '@/core/user/use-cases/user-refresh-token'
import { ICacheAdapter } from '@/infra/cache'
import { BaseException } from '@/utils/exception'
import { TestUtils } from '@/utils/test'
import { TestPostgresContainer, TestRedisContainer } from '@/utils/test/e2e/containers'
import { RoleFixture } from '@/utils/test/e2e/fixtures/role'
import { UserFixture } from '@/utils/test/e2e/fixtures/user'
import { TestEnd2EndUtils } from '@/utils/test/e2e/utils'

import { LoginController } from '../controller'
import { LoginModule } from '../module'

describe(LoginController.name, () => {
  let app: INestApplication
  let userRepository: IUserRepository
  let roleRepository: IRoleRepository
  let redisService: ICacheAdapter

  const userFixture = new UserFixture()
  const roleFixture = new RoleFixture()
  const postgresContainer = new TestPostgresContainer()
  const redisContainer = new TestRedisContainer()

  beforeAll(async () => {
    const { postgresConfig } = await postgresContainer.getPostgres()
    redisService = await redisContainer.getTestRedis()

    const moduleRef = await Test.createTestingModule({
      imports: [LoginModule, TestEnd2EndUtils.getPostgresModule(postgresContainer, postgresConfig)]
    })
      .overrideProvider(ICacheAdapter)
      .useValue(redisService)
      .compile()

    app = await TestEnd2EndUtils.createApp(moduleRef)

    userRepository = moduleRef.get(IUserRepository)
    roleRepository = moduleRef.get(IRoleRepository)
    await userFixture.down(userRepository)
    await userFixture.up(userRepository)
  })

  afterEach(async () => {
    userFixture.entity.roles = []
    await userFixture.down(userRepository)
    await roleFixture.down(roleRepository)
    await userFixture.up(userRepository)
  })

  afterAll(async () => {
    await userFixture.down(userRepository)
    await roleFixture.down(roleRepository)
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
      expect(res.body).toHaveProperty(TestUtils.nameOf<LoginOutput>('accessToken'))
      expect(typeof res.body.accessToken).toBe('string')
    })

    it('should fail with invalid password', async () => {
      const res = await request(app.getHttpServer())
        .post('/login')
        .send({ email: userFixture.entity.email, password: 'wrongpass' })
      expect([400, 401]).toContain(res.status)
      expect(res.body).toHaveProperty(TestUtils.nameOf<BaseException>('message'))
    })

    it('should fail with non-existent user', async () => {
      const res = await request(app.getHttpServer())
        .post('/login')
        .send({ email: 'notfound@example.com', password: 'admin' })
      expect([400, 401, 404]).toContain(res.status)
      expect(res.body).toHaveProperty(TestUtils.nameOf<BaseException>('message'))
    })
  })

  describe('/POST /refresh', () => {
    it('should refresh tokens for a user with roles', async () => {
      await userFixture.down(userRepository)
      await roleFixture.up(roleRepository)
      userFixture.entity.roles = [roleFixture.entity[0]]
      await userFixture.up(userRepository)

      const login = await request(app.getHttpServer())
        .post('/login')
        .send({ email: userFixture.entity.email, password: 'admin' })
        .expect(201)

      const response = await request(app.getHttpServer())
        .post('/refresh')
        .send({ refreshToken: login.body.refreshToken })
        .expect(201)

      expect(response.body).toHaveProperty(TestUtils.nameOf<RefreshTokenOutput>('accessToken'))
      expect(response.body).toHaveProperty(TestUtils.nameOf<RefreshTokenOutput>('refreshToken'))
    })
  })
})
