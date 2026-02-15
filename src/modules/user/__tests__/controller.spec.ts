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
import { IUserRepository } from '@/core/user/repository/user'
import { UserChangePasswordInput } from '@/core/user/use-cases/user-change-password'
import { UserCreateInput, UserCreateOutput } from '@/core/user/use-cases/user-create'
import { UserGetByIdOutput } from '@/core/user/use-cases/user-get-by-id'
import { UserListOutput } from '@/core/user/use-cases/user-list'
import { UserUpdateInput, UserUpdateOutput } from '@/core/user/use-cases/user-update'
import { ICacheAdapter } from '@/infra/cache'
import { UserSchema } from '@/infra/database/postgres/schemas/user'
import { ITokenAdapter } from '@/libs/token/adapter'
import { ApiBadRequestException, ApiNotFoundException, ApiUnauthorizedException } from '@/utils/exception'
import { UserRequest } from '@/utils/request'
import { TestPostgresContainer, TestRedisContainer } from '@/utils/test/e2e/containers'
import { PermissionFixture } from '@/utils/test/e2e/fixtures/permission'
import { RoleFixture } from '@/utils/test/e2e/fixtures/role'
import { UserFixture } from '@/utils/test/e2e/fixtures/user'
import { FixtureUtils } from '@/utils/test/e2e/fixtures/utils'
import { TestEnd2EndUtils } from '@/utils/test/e2e/utils'
import { TestUtils } from '@/utils/test/utils'

import { UserController } from '../controller'
import { UserModule } from '../module'
import { UserModel, UserRepository } from '../repository'

describe(UserController.name, () => {
  const tokenValue = TestEnd2EndUtils.AUTHORIZATION_HEADER[1].split(' ')[1]

  let app: INestApplication
  let redisService: ICacheAdapter
  let userRepository: IUserRepository
  let permissionRepository: IPermissionRepository
  let roleRepository: IRoleRepository

  const redisContainer = new TestRedisContainer()
  const postgresContainer = new TestPostgresContainer()
  const userFixture = new UserFixture()
  const permissionFixture = new PermissionFixture()
  const roleFixture = new RoleFixture()

  beforeAll(async () => {
    const { postgresConfig } = await postgresContainer.getPostgres()

    redisService = await redisContainer.getTestRedis()

    const moduleRef = await Test.createTestingModule({
      imports: [UserModule, TestEnd2EndUtils.getPostgresModule(postgresContainer, postgresConfig)],
      providers: [TestEnd2EndUtils.getGuardProvider([IUserRepository])]
    })
      .overrideProvider(IUserRepository)
      .useFactory({
        factory(repository: Repository<UserModel>) {
          {
            return new UserRepository(repository)
          }
        },
        inject: [getRepositoryToken(UserSchema)]
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

    userRepository = moduleRef.get(IUserRepository)
    permissionRepository = moduleRef.get(IPermissionRepository)
    roleRepository = moduleRef.get(IRoleRepository)

    await userFixture.down(userRepository)
    await permissionFixture.down(permissionRepository)
    await roleFixture.down(roleRepository)

    FixtureUtils.addBaseSeeds(permissionFixture, roleFixture, userFixture)
  })

  afterEach(async () => {
    await userFixture.down(userRepository)
    await permissionFixture.down(permissionRepository)
    await roleFixture.down(roleRepository)
    await redisService.del(tokenValue)
  })

  beforeEach(async () => {
    await permissionFixture.up(permissionRepository)
    await roleFixture.up(roleRepository)
    await userFixture.up(userRepository)
  })

  it(`/GET /v1/users with admin user returns response`, async () => {
    const response = await request(app.getHttpServer())
      .get('/users')
      .set(...TestEnd2EndUtils.AUTHORIZATION_HEADER)
      .expect(200)
    return response
  })

  it(`/GET /v1/users with admin user returns correct properties`, async () => {
    const response = await request(app.getHttpServer())
      .get('/users')
      .set(...TestEnd2EndUtils.AUTHORIZATION_HEADER)
      .expect(200)
    expect(response.body).toHaveProperty(TestUtils.nameOf<UserListOutput>('docs'))
    expect(response.body).toHaveProperty(TestUtils.nameOf<UserListOutput>('limit'))
    expect(response.body).toHaveProperty(TestUtils.nameOf<UserListOutput>('page'))
    expect(response.body).toHaveProperty(TestUtils.nameOf<UserListOutput>('total'))
    expect(response.body.docs).toHaveLength(1)
  })

  it(`/GET /v1/users without token should fail`, async () => {
    await request(app.getHttpServer()).get('/users').expect(ApiUnauthorizedException.STATUS)
  })

  it(`/GET /v1/users/me`, async () => {
    const response = await request(app.getHttpServer())
      .get('/users/me')
      .set(...TestEnd2EndUtils.AUTHORIZATION_HEADER)
      .expect(200)
    expect(response.body).toHaveProperty(TestUtils.nameOf<UserRequest>('email'))
    expect(response.body).toHaveProperty(TestUtils.nameOf<UserRequest>('id'))
    expect(response.body).toHaveProperty(TestUtils.nameOf<UserRequest>('name'))
  })

  it(`/GET /v1/users/:id`, async () => {
    const user = userFixture.entity
    const response = await request(app.getHttpServer())
      .get(`/users/${user.id}`)
      .set(...TestEnd2EndUtils.AUTHORIZATION_HEADER)
      .expect(200)
    expect(response.body).toHaveProperty(TestUtils.nameOf<UserGetByIdOutput>('id'), user.id)
    expect(response.body).toHaveProperty(TestUtils.nameOf<UserGetByIdOutput>('email'), user.email)
  })

  it(`/GET /v1/users/:id not found`, async () => {
    await request(app.getHttpServer())
      .get(`/users/${TestUtils.mockUUID()}`)
      .set(...TestEnd2EndUtils.AUTHORIZATION_HEADER)
      .expect(ApiNotFoundException.STATUS)
  })

  it(`/POST /v1/users`, async () => {
    const user = {
      name: TestUtils.faker.person.fullName(),
      email: TestUtils.faker.internet.email(),
      password: TestUtils.faker.internet.password(),
      roles: userFixture.entity.roles.map((r) => r.name)
    } as UserCreateInput

    const response = await request(app.getHttpServer())
      .post('/users')
      .set(...TestEnd2EndUtils.AUTHORIZATION_HEADER)
      .send(user)
      .expect(201)
    expect(response.body).toHaveProperty(TestUtils.nameOf<UserCreateOutput>('id'))
    expect(response.body).toHaveProperty(TestUtils.nameOf<UserCreateOutput>('created'), true)
  })

  it(`/POST /v1/users blacklist token error`, async () => {
    await redisService.set(tokenValue, tokenValue, { PX: 3000 })
    await request(app.getHttpServer())
      .post('/users')
      .set(...TestEnd2EndUtils.AUTHORIZATION_HEADER)
      .send({})
      .expect(ApiUnauthorizedException.STATUS)
  })

  it(`/POST /v1/users with missing fields`, async () => {
    await request(app.getHttpServer())
      .post('/users')
      .set(...TestEnd2EndUtils.AUTHORIZATION_HEADER)
      .send()
      .expect(ApiBadRequestException.STATUS)
  })

  it(`/PUT /v1/users/:id`, async () => {
    const body = { name: 'Updated Name' } as UserUpdateInput
    const user = userFixture.entity
    const response = await request(app.getHttpServer())
      .put(`/users/${user.id}`)
      .set(...TestEnd2EndUtils.AUTHORIZATION_HEADER)
      .send(body)
      .expect(200)
    expect(response.body).toHaveProperty(TestUtils.nameOf<UserUpdateOutput>('id'), user.id)
    expect(response.body).toHaveProperty(TestUtils.nameOf<UserUpdateOutput>('name'), body.name)
  })

  it(`/PUT /v1/users/:id not found`, async () => {
    await request(app.getHttpServer())
      .put(`/users/${TestUtils.mockUUID()}`)
      .set(...TestEnd2EndUtils.AUTHORIZATION_HEADER)
      .send({ name: 'Updated Name' })
      .expect(ApiNotFoundException.STATUS)
  })

  it(`/PUT /v1/users/change-password/:id`, async () => {
    const user = userFixture.entity
    await request(app.getHttpServer())
      .put(`/users/change-password/${user.id}`)
      .set(...TestEnd2EndUtils.AUTHORIZATION_HEADER)
      .send({
        password: `admin`,
        newPassword: '654321',
        confirmPassword: '654321'
      } as UserChangePasswordInput)
      .expect(200)
  })

  it(`/PUT /v1/users/change-password/:id with wrong password`, async () => {
    const user = userFixture.entity
    await request(app.getHttpServer())
      .put(`/users/change-password/${user.id}`)
      .set(...TestEnd2EndUtils.AUTHORIZATION_HEADER)
      .send({ password: '123456', newPassword: '654321', confirmPassword: 'wrong' })
      .expect(ApiBadRequestException.STATUS)
  })

  it(`/PUT /v1/users/change-password/:id with wrong confirm`, async () => {
    const user = userFixture.entity
    await request(app.getHttpServer())
      .put(`/users/change-password/${user.id}`)
      .set(...TestEnd2EndUtils.AUTHORIZATION_HEADER)
      .send({ password: 'admin', newPassword: '654321', confirmPassword: 'wrong' })
      .expect(ApiBadRequestException.STATUS)
  })

  it(`/DELETE /v1/users/:id`, async () => {
    const user = userFixture.entity
    await request(app.getHttpServer())
      .delete(`/users/${user.id}`)
      .set(...TestEnd2EndUtils.AUTHORIZATION_HEADER)
      .expect(200)
  })

  it(`/DELETE /v1/users/:id not found`, async () => {
    await request(app.getHttpServer())
      .delete(`/users/${TestUtils.mockUUID()}`)
      .set(...TestEnd2EndUtils.AUTHORIZATION_HEADER)
      .expect(ApiNotFoundException.STATUS)
  })

  afterAll(async () => {
    await userFixture.down(userRepository)
    await permissionFixture.down(permissionRepository)
    await roleFixture.down(roleRepository)
    await redisService.client.flushAll()
    await postgresContainer.close()
    await redisContainer.close()
    await app.close()
  })
})
