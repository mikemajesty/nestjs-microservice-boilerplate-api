/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/modules/test.md
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/tests/standards.md
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/tests/containers.md
 */
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import jwt from 'jsonwebtoken'
import request from 'supertest'

import { IRoleRepository } from '@/core/role/repository/role'
import { IUserRepository } from '@/core/user/repository/user'
import { LoginOutput } from '@/core/user/use-cases/user-login'
import { RefreshTokenInput, RefreshTokenOutput } from '@/core/user/use-cases/user-refresh-token'
import { ICacheAdapter } from '@/infra/cache'
import { ApiUnauthorizedException, BaseException } from '@/utils/exception'
import { TestUtils } from '@/utils/test'
import { RoleFixture, TestEnd2EndUtils, TestPostgresContainer, TestRedisContainer, UserFixture } from '@/utils/test/e2e'

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
      expect(res.status).toBe(ApiUnauthorizedException.STATUS)
      expect(res.body).toHaveProperty(TestUtils.nameOf<BaseException>('message'))
    })

    it('should fail with non-existent user', async () => {
      const res = await request(app.getHttpServer())
        .post('/login')
        .send({ email: 'notfound@example.com', password: 'admin' })
      expect(res.status).toBe(ApiUnauthorizedException.STATUS)
      expect(res.body).toHaveProperty(TestUtils.nameOf<BaseException>('message'))
    })

    it('should answer unknown email and wrong password with the same error', async () => {
      const unknown = await request(app.getHttpServer())
        .post('/login')
        .send({ email: 'notfound@example.com', password: 'admin' })
      const wrongPassword = await request(app.getHttpServer())
        .post('/login')
        .send({ email: userFixture.entity.email, password: 'wrongpass' })

      expect(unknown.status).toBe(wrongPassword.status)
      expect(unknown.body.message).toEqual(wrongPassword.body.message)
    })
  })

  describe('/POST /refresh', () => {
    const login = async () => {
      const res = await request(app.getHttpServer())
        .post('/login')
        .send({ email: userFixture.entity.email, password: 'admin' })
        .expect(201)
      return res.body as LoginOutput
    }
    const refresh = (refreshToken: string) =>
      request(app.getHttpServer())
        .post('/refresh')
        .send({ refreshToken } as RefreshTokenInput)

    beforeEach(async () => {
      await userFixture.down(userRepository)
      await roleFixture.up(roleRepository)
      userFixture.entity.roles = [roleFixture.entity[0]]
      await userFixture.up(userRepository)
    })

    it('should refresh tokens for a user with roles', async () => {
      const tokens = await login()

      const response = await refresh(tokens.refreshToken).expect(201)

      expect(response.body).toHaveProperty(TestUtils.nameOf<RefreshTokenOutput>('accessToken'))
      expect(response.body).toHaveProperty(TestUtils.nameOf<RefreshTokenOutput>('refreshToken'))
    })

    it('should issue a refresh token that outlives the access token', async () => {
      const tokens = await login()
      const lifetime = (token: string) => {
        const { exp, iat } = jwt.decode(token) as { exp: number; iat: number }
        return exp - iat
      }

      expect(lifetime(tokens.refreshToken)).toBe(Number(process.env.REFRESH_TOKEN_EXPIRATION))
      expect(lifetime(tokens.accessToken)).toBe(Number(process.env.TOKEN_EXPIRATION))
    })

    it('should reject a refresh token that was already used (rotation)', async () => {
      const tokens = await login()
      await refresh(tokens.refreshToken).expect(201)

      await refresh(tokens.refreshToken).expect(ApiUnauthorizedException.STATUS)
    })

    it('should revoke the whole session when an old refresh token is reused', async () => {
      const tokens = await login()
      const rotated = (await refresh(tokens.refreshToken).expect(201)).body as RefreshTokenOutput

      await refresh(tokens.refreshToken).expect(ApiUnauthorizedException.STATUS)

      await refresh(rotated.refreshToken).expect(ApiUnauthorizedException.STATUS)
    })

    it('should keep other sessions working when one is revoked', async () => {
      const first = await login()
      const second = await login()

      await refresh(first.refreshToken).expect(201)
      await refresh(first.refreshToken).expect(ApiUnauthorizedException.STATUS)

      await refresh(second.refreshToken).expect(201)
    })

    it('should reject an access token used as refresh token', async () => {
      const tokens = await login()

      await refresh(tokens.accessToken).expect(ApiUnauthorizedException.STATUS)
    })
  })
})
