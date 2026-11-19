/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/modules/test.md
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/tests/standards.md
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/tests/containers.md
 */
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'

import { IPermissionRepository } from '@/core/permission/repository/permission'
import { IRoleRepository } from '@/core/role/repository/role'
import { IUserRepository } from '@/core/user/repository/user'
import { LoginOutput } from '@/core/user/use-cases/user-login'
import { ICacheAdapter } from '@/infra/cache'
import { GuardsModule } from '@/middlewares/guards/module'
import { LoginModule } from '@/modules/login/module'
import { ApiForbiddenException, ApiUnauthorizedException, BaseException } from '@/utils/exception'
import { Namespaces } from '@/utils/namespaces'
import { TestUtils } from '@/utils/test'
import {
  FixtureUtils,
  PermissionFixture,
  RoleFixture,
  TestEnd2EndUtils,
  TestPostgresContainer,
  TestRedisContainer,
  UserFixture
} from '@/utils/test/e2e'

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
  let redisService: ICacheAdapter

  beforeAll(async () => {
    const { postgresConfig } = await postgresContainer.getPostgres()
    redisService = await redisContainer.getTestRedis()
    const moduleRef = await Test.createTestingModule({
      imports: [
        LoginModule,
        LogoutModule,
        GuardsModule,
        TestEnd2EndUtils.getPostgresModule(postgresContainer, postgresConfig)
      ]
    })
      .overrideProvider(ICacheAdapter)
      .useValue(redisService)
      .compile()

    app = await TestEnd2EndUtils.createApp(moduleRef)

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
    const login = async () => {
      const res = await request(app.getHttpServer())
        .post('/login')
        .send({ email: userFixture.entity.email, password: 'admin' })
      expect(res.status).toBe(201)
      return res.body as LoginOutput
    }
    const logout = (accessToken: string) =>
      request(app.getHttpServer()).post('/logout').set('Authorization', `Bearer ${accessToken}`)

    const refresh = (refreshToken: string) => request(app.getHttpServer()).post('/refresh').send({ refreshToken })

    it('should logout successfully with valid user and permission', async () => {
      const tokens = await login()

      await logout(tokens.accessToken).expect(204)
    })

    it('should end the session: its access and refresh tokens stop working', async () => {
      const tokens = await login()
      await logout(tokens.accessToken).expect(204)

      await logout(tokens.accessToken).expect(ApiUnauthorizedException.STATUS)
      await refresh(tokens.refreshToken).expect(ApiUnauthorizedException.STATUS)
    })

    it('should allow logging in again right after logout', async () => {
      const first = await login()
      await logout(first.accessToken).expect(204)

      const second = await login()

      await logout(second.accessToken).expect(204)
    })

    it('should keep the other sessions of the same user', async () => {
      const laptop = await login()
      const phone = await login()

      await logout(laptop.accessToken).expect(204)

      await refresh(phone.refreshToken).expect(201)
    })

    it('should fail if not authenticated', async () => {
      const res = await request(app.getHttpServer()).post('/logout')

      expect(res.status).toBe(ApiUnauthorizedException.STATUS)
      expect(res.body).toHaveProperty(TestUtils.nameOf<BaseException>('message'))
      expect(typeof res.body.message).toBe('string')
    })

    it('should fail if user lacks permission', async () => {
      const logoutPermission = permissionFixture.entity.find((p) => p.name === 'user:logout')
      expect(logoutPermission).toBeDefined()
      await permissionFixture.removeRole(logoutPermission!, roleFixture.entity, roleRepository)
      await redisService.del(roleFixture.entity.map((role) => Namespaces.roleById(role.id)))

      const tokens = await login()
      const res = await logout(tokens.accessToken)

      expect(res.status).toBe(ApiForbiddenException.STATUS)
      expect(res.body).toHaveProperty(TestUtils.nameOf<BaseException>('message'))
    })
  })
})
