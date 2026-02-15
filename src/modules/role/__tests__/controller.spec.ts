/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/modules/test.md
 */
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import request from 'supertest'
import { Repository } from 'typeorm'

import { IPermissionRepository } from '@/core/permission/repository/permission'
import { IRoleRepository } from '@/core/role/repository/role'
import { RoleCreateInput, RoleCreateOutput } from '@/core/role/use-cases/role-create'
import { RoleGetByIdOutput } from '@/core/role/use-cases/role-get-by-id'
import { RoleListOutput } from '@/core/role/use-cases/role-list'
import { RoleUpdateOutput } from '@/core/role/use-cases/role-update'
import { IUserRepository } from '@/core/user/repository/user'
import { ICacheAdapter } from '@/infra/cache'
import { RoleSchema } from '@/infra/database/postgres/schemas/role'
import { ITokenAdapter } from '@/libs/token/adapter'
import { UserModule } from '@/modules/user/module'
import { ApiBadRequestException, ApiConflictException, ApiNotFoundException } from '@/utils/exception'
import { UserRequest } from '@/utils/request'
import { TestPostgresContainer, TestRedisContainer } from '@/utils/test/e2e/containers'
import { PermissionFixture } from '@/utils/test/e2e/fixtures/permission'
import { RoleFixture } from '@/utils/test/e2e/fixtures/role'
import { UserFixture } from '@/utils/test/e2e/fixtures/user'
import { FixtureUtils } from '@/utils/test/e2e/fixtures/utils'
import { TestEnd2EndUtils } from '@/utils/test/e2e/utils'
import { TestUtils } from '@/utils/test/utils'

import { RoleController } from '../controller'
import { RoleModule } from '../module'
import { RoleModel, RoleRepository } from '../repository'

describe(RoleController.name, () => {
  const tokenValue = TestEnd2EndUtils.AUTHORIZATION_HEADER[1].split(' ')[1]

  let app: INestApplication
  let redisService: ICacheAdapter
  let roleRepository: IRoleRepository
  let permissionRepository: IPermissionRepository
  let userRepository: IUserRepository

  const redisContainer = new TestRedisContainer()
  const postgresContainer = new TestPostgresContainer()

  const userFixture = new UserFixture()
  const roleFixture = new RoleFixture()
  const permissionFixture = new PermissionFixture()

  beforeAll(async () => {
    const { postgresConfig } = await postgresContainer.getPostgres()
    redisService = await redisContainer.getTestRedis()

    const moduleRef = await Test.createTestingModule({
      imports: [UserModule, RoleModule, TestEnd2EndUtils.getPostgresModule(postgresContainer, postgresConfig)],
      providers: [TestEnd2EndUtils.getGuardProvider([IUserRepository])]
    })
      .overrideProvider(IRoleRepository)
      .useFactory({
        factory(repository: Repository<RoleModel>) {
          return new RoleRepository(repository)
        },
        inject: [getRepositoryToken(RoleSchema)]
      })
      .overrideProvider(ITokenAdapter)
      .useValue({
        verify: TestUtils.mockResolvedValue<UserRequest>({
          name: userFixture.entity.name,
          email: userFixture.entity.email,
          id: userFixture.entity.id
        })
      })
      .overrideProvider(ICacheAdapter)
      .useValue(redisService)
      .compile()

    app = moduleRef.createNestApplication()
    TestEnd2EndUtils.addTracing(app)
    await app.init()

    roleRepository = moduleRef.get(IRoleRepository)
    permissionRepository = moduleRef.get(IPermissionRepository)
    userRepository = moduleRef.get(IUserRepository)

    await userFixture.down(userRepository)
    await roleFixture.down(roleRepository)
    await permissionFixture.down(permissionRepository)

    FixtureUtils.addBaseSeeds(permissionFixture, roleFixture, userFixture)
  })

  afterEach(async () => {
    await userFixture.down(userRepository)
    await roleFixture.down(roleRepository)
    await permissionFixture.down(permissionRepository)

    await redisService.del(tokenValue)
  })

  beforeEach(async () => {
    await permissionFixture.up(permissionRepository)
    await roleFixture.up(roleRepository)
    await userFixture.up(userRepository)
  })

  const baseRole = roleFixture.entity[0]

  it('/GET /v1/roles', async () => {
    const response = await request(app.getHttpServer())
      .get('/roles')
      .set(...TestEnd2EndUtils.AUTHORIZATION_HEADER)
      .expect(200)
    expect(Array.isArray(response.body.docs)).toBe(true)
  })

  it('/POST /v1/roles', async () => {
    const role: RoleCreateInput = { name: 'new-role' }
    const response = await request(app.getHttpServer())
      .post('/roles')
      .set(...TestEnd2EndUtils.AUTHORIZATION_HEADER)
      .send(role)
      .expect(201)
    expect(response.body).toHaveProperty(TestUtils.nameOf<RoleCreateOutput>('id'))
    expect(response.body).toHaveProperty(TestUtils.nameOf<RoleCreateOutput>('created'), true)
  })

  it('/PUT /v1/roles/:id', async () => {
    const update = { name: 'UPDATED-ROLE' }
    const response = await request(app.getHttpServer())
      .put(`/roles/${baseRole.id}`)
      .set(...TestEnd2EndUtils.AUTHORIZATION_HEADER)
      .send(update)
      .expect(200)
    expect(response.body).toHaveProperty(TestUtils.nameOf<RoleUpdateOutput>('id'), baseRole.id)
    expect(response.body).toHaveProperty(TestUtils.nameOf<RoleUpdateOutput>('name'), update.name)
  })

  it('/DELETE /v1/roles/:id with role association error', async () => {
    await request(app.getHttpServer())
      .delete(`/roles/${baseRole.id}`)
      .set(...TestEnd2EndUtils.AUTHORIZATION_HEADER)
      .expect(ApiConflictException.STATUS)
  })

  it('/DELETE /v1/roles/:id', async () => {
    await userFixture.removeRoles(userRepository, baseRole)
    await request(app.getHttpServer())
      .delete(`/roles/${baseRole.id}`)
      .set(...TestEnd2EndUtils.AUTHORIZATION_HEADER)
      .expect(ApiConflictException.STATUS)
  })

  it('/GET /v1/roles/:id not found', async () => {
    await request(app.getHttpServer())
      .get(`/roles/${TestUtils.mockUUID()}`)
      .set(...TestEnd2EndUtils.AUTHORIZATION_HEADER)
      .expect(ApiNotFoundException.STATUS)
  })

  it('/POST /v1/roles with missing fields', async () => {
    await request(app.getHttpServer())
      .post('/roles')
      .set(...TestEnd2EndUtils.AUTHORIZATION_HEADER)
      .send({})
      .expect(ApiBadRequestException.STATUS)
  })

  it('/GET /v1/roles/:id (success)', async () => {
    const response = await request(app.getHttpServer())
      .get(`/roles/${baseRole.id}`)
      .set(...TestEnd2EndUtils.AUTHORIZATION_HEADER)
      .expect(200)
    expect(response.body).toHaveProperty(TestUtils.nameOf<RoleGetByIdOutput>('id'), baseRole.id)
    expect(response.body).toHaveProperty(TestUtils.nameOf<RoleGetByIdOutput>('name'), baseRole.name)
  })

  it('/GET /v1/roles with pagination', async () => {
    const response = await request(app.getHttpServer())
      .get('/roles?limit=2&page=1')
      .set(...TestEnd2EndUtils.AUTHORIZATION_HEADER)
      .expect(200)
    expect(response.body).toHaveProperty(TestUtils.nameOf<RoleListOutput>('docs'))
    expect(Array.isArray(response.body.docs)).toBe(true)
    expect(response.body).toHaveProperty(TestUtils.nameOf<RoleListOutput>('limit'), 2)
    expect(response.body).toHaveProperty(TestUtils.nameOf<RoleListOutput>('page'), 1)
  })

  afterAll(async () => {
    await userFixture.down(userRepository)
    await roleFixture.down(roleRepository)
    await permissionFixture.down(permissionRepository)
    await redisService.client.flushAll()
    await postgresContainer.close()
    await redisContainer.close()
    await app.close()
  })
})
