import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'

import { IPermissionRepository } from '@/core/permission/repository/permission'
import { IRoleRepository } from '@/core/role/repository/role'
import { IUserRepository } from '@/core/user/repository/user'
import { LogoutInput } from '@/core/user/use-cases/user-logout'
import { ICacheAdapter } from '@/infra/cache'
import { LoginModule } from '@/modules/login/module'
import { UserModule } from '@/modules/user/module'
import { ApiUnauthorizedException } from '@/utils/exception'
import { TestPostgresContainer, TestRedisContainer } from '@/utils/test/e2e/containers'
import { PermissionFixture } from '@/utils/test/e2e/fixtures/permission'
import { RoleFixture } from '@/utils/test/e2e/fixtures/role'
import { UserFixture } from '@/utils/test/e2e/fixtures/user'
import { FixtureUtils } from '@/utils/test/e2e/fixtures/utils'
import { TestEnd2EndUtils } from '@/utils/test/e2e/utils'

import { LogoutController } from '../controller'
import { LogoutModule } from '../module'

describe(LogoutController.name, () => {
  let app: INestApplication
  let roleRepository: IRoleRepository
  let permissionRepository: IPermissionRepository
  let userRepository: IUserRepository

  const userFixture = new UserFixture()
  const roleFixture = new RoleFixture()
  const permissionFixture = new PermissionFixture()

  const postgresContainer = new TestPostgresContainer()
  const redisContainer = new TestRedisContainer()

  beforeAll(async () => {
    const { postgresConfig } = await postgresContainer.getPostgres()
    const moduleRef = await Test.createTestingModule({
      imports: [
        LoginModule,
        UserModule,
        LogoutModule,
        TestEnd2EndUtils.getPostgresModule(postgresContainer, postgresConfig)
      ],
      providers: [
        TestEnd2EndUtils.getGuardProvider([IUserRepository]),
        {
          provide: ICacheAdapter,
          useFactory: async () => {
            return await redisContainer.getTestRedis()
          }
        }
      ]
    }).compile()

    app = moduleRef.createNestApplication()
    TestEnd2EndUtils.addTracing(app)
    await app.init()

    permissionRepository = moduleRef.get(IPermissionRepository)
    roleRepository = moduleRef.get(IRoleRepository)
    userRepository = moduleRef.get(IUserRepository)

    await userFixture.down(userRepository)
    await permissionFixture.down(permissionRepository)
    await roleFixture.down(roleRepository)

    FixtureUtils.addBaseSeeds(permissionFixture, roleFixture, userFixture)
  })

  afterEach(async () => {
    await userFixture.down(userRepository)
    await permissionFixture.down(permissionRepository)
    await roleFixture.down(roleRepository)
  })

  beforeEach(async () => {
    await permissionFixture.up(permissionRepository)
    await roleFixture.up(roleRepository)
    await userFixture.up(userRepository)
  })

  afterAll(async () => {
    await userFixture.down(userRepository)
    await permissionFixture.down(permissionRepository)
    await roleFixture.down(roleRepository)
    await postgresContainer.close()
    await app.close()
  })

  describe('/POST /logout', () => {
    it('should logout successfully with valid user and permission', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/login')
        .send({ email: userFixture.entity.email, password: 'admin' })
      expect(loginRes.status).toBe(201)
      const token = loginRes.body?.accessToken
      expect(token).toBeDefined()

      const res = await request(app.getHttpServer())
        .post('/logout')
        .set('Authorization', `Bearer ${token}`)
        .send({
          token
        } as LogoutInput)
      expect(res.status).toBe(401)
      expect(res.body).toHaveProperty('message')
      expect(typeof res.body.message).toBe('string')
    })

    it('should fail if not authenticated', async () => {
      const res = await request(app.getHttpServer()).post('/logout')
      expect(res.status).toBe(ApiUnauthorizedException.STATUS)
      expect(res.body).toHaveProperty('message')
      expect(typeof res.body.message).toBe('string')
    })

    it('should fail if user lacks permission', async () => {
      const logoutPermission = permissionFixture.entity.find((p) => p.name === 'user:logout')
      expect(logoutPermission).toBeDefined()
      await permissionFixture.removeRole(logoutPermission!, roleFixture.entity, roleRepository)
      const loginRes = await request(app.getHttpServer())
        .post('/login')
        .send({ email: userFixture.entity.email, password: 'admin' })
      expect(loginRes.status).toBe(201)
      const token = loginRes.body?.accessToken
      expect(token).toBeDefined()

      const res = await request(app.getHttpServer())
        .post('/logout')
        .set('Authorization', `Bearer ${token}`)
        .send({
          token
        } as LogoutInput)
      expect([401, 403]).toContain(res.status)
      expect(res.body).toHaveProperty('message')
      expect(typeof res.body.message).toBe('string')
    })
  })
})
