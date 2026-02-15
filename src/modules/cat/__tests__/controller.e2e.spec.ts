/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/modules/test.md
 */
import { ZodMockSchema } from '@mikemajesty/zod-mock-schema'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import mongoose, { PaginateModel, Schema } from 'mongoose'
import request from 'supertest'

import { ICatRepository } from '@/core/cat/repository/cat'
import { CatCreateOutput, CatCreateSchema } from '@/core/cat/use-cases/cat-create'
import { CatGetByIdOutput } from '@/core/cat/use-cases/cat-get-by-id'
import { CatListOutput } from '@/core/cat/use-cases/cat-list'
import { CatUpdateOutput } from '@/core/cat/use-cases/cat-update'
import { IPermissionRepository } from '@/core/permission/repository/permission'
import { IRoleRepository } from '@/core/role/repository/role'
import { IUserRepository } from '@/core/user/repository/user'
import { ConnectionName } from '@/infra/database/enum'
import { Cat, CatDocument, CatSchema } from '@/infra/database/mongo/schemas/cat'
import { ITokenAdapter } from '@/libs/token'
import { UserModule } from '@/modules/user/module'
import { UserRequest } from '@/utils/request'
import { TestMongoContainer, TestPostgresContainer, TestRedisContainer } from '@/utils/test/e2e/containers'
import { PermissionFixture } from '@/utils/test/e2e/fixtures/permission'
import { RoleFixture } from '@/utils/test/e2e/fixtures/role'
import { UserFixture } from '@/utils/test/e2e/fixtures/user'
import { FixtureUtils } from '@/utils/test/e2e/fixtures/utils'
import { TestEnd2EndUtils } from '@/utils/test/e2e/utils'
import { TestUtils } from '@/utils/test/utils'

import { CatController } from '../controller'
import { CatModule } from '../module'
import { CatRepository } from '../repository'

describe(CatController.name, () => {
  let app: INestApplication

  let roleRepository: IRoleRepository
  let permissionRepository: IPermissionRepository
  let userRepository: IUserRepository

  const redisContainer = new TestRedisContainer()
  const postgresContainer = new TestPostgresContainer()
  const mongoContainer = new TestMongoContainer()

  const userFixture = new UserFixture()
  const roleFixture = new RoleFixture()
  const permissionFixture = new PermissionFixture()

  beforeAll(async () => {
    const { mongoConnection } = await mongoContainer.getTestMongo(ConnectionName.CATS)
    const { postgresConfig } = await postgresContainer.getPostgres()

    const moduleRef = await Test.createTestingModule({
      imports: [UserModule, CatModule, TestEnd2EndUtils.getPostgresModule(postgresContainer, postgresConfig)],
      providers: [TestEnd2EndUtils.getGuardProvider([IUserRepository])]
    })
      .overrideProvider(ICatRepository)
      .useFactory({
        factory() {
          {
            type Model = mongoose.PaginateModel<CatDocument>

            const repository: PaginateModel<CatDocument> = mongoConnection.model<CatDocument, Model>(
              Cat.name,
              CatSchema as Schema
            )
            return new CatRepository(repository)
          }
        }
      })
      .overrideProvider(ITokenAdapter)
      .useValue({
        verify: TestUtils.mockResolvedValue<UserRequest>({
          name: userFixture.entity.name,
          email: userFixture.entity.email,
          id: userFixture.entity.id
        })
      })
      .compile()

    app = moduleRef.createNestApplication()
    permissionRepository = moduleRef.get<IPermissionRepository>(IPermissionRepository)
    roleRepository = moduleRef.get<IRoleRepository>(IRoleRepository)
    userRepository = moduleRef.get<IUserRepository>(IUserRepository)

    TestEnd2EndUtils.addTracing(app)
    await app.init()

    await userFixture.down(userRepository)
    await roleFixture.down(roleRepository)
    await permissionFixture.down(permissionRepository)

    FixtureUtils.addBaseSeeds(permissionFixture, roleFixture, userFixture)
  })

  afterEach(async () => {
    await userFixture.down(userRepository)
    await roleFixture.down(roleRepository)
    await permissionFixture.down(permissionRepository)
  })

  beforeEach(async () => {
    await permissionFixture.up(permissionRepository)
    await roleFixture.up(roleRepository)
    await userFixture.up(userRepository)
  })

  it(`/GET /v1/cats`, async () => {
    const response = await request(app.getHttpServer())
      .get('/cats')
      .set(...TestEnd2EndUtils.AUTHORIZATION_HEADER)
      .expect(200)
    expect(response.body).toHaveProperty(TestUtils.nameOf<CatListOutput>('docs'))
    expect(response.body).toHaveProperty(TestUtils.nameOf<CatListOutput>('limit'))
    expect(response.body).toHaveProperty(TestUtils.nameOf<CatListOutput>('page'))
    expect(response.body).toHaveProperty(TestUtils.nameOf<CatListOutput>('total'))
  })

  it('/POST /cats should create a cat', async () => {
    const catFixture = new ZodMockSchema(CatCreateSchema)
    const entity = catFixture.generate()
    const response = await request(app.getHttpServer())
      .post('/cats')
      .set(...TestEnd2EndUtils.AUTHORIZATION_HEADER)
      .send(entity)
      .expect(201)
    expect(response.body).toHaveProperty(TestUtils.nameOf<CatCreateOutput>('id'))
    expect(response.body).toHaveProperty(TestUtils.nameOf<CatCreateOutput>('created'), true)
  })

  it('/GET /cats/:id should get by id', async () => {
    const catFixture = new ZodMockSchema(CatCreateSchema)
    const entity = catFixture.generate()
    const createRes = await request(app.getHttpServer())
      .post('/cats')
      .set(...TestEnd2EndUtils.AUTHORIZATION_HEADER)
      .send(entity)
      .expect(201)
    const id = createRes.body.id

    const response = await request(app.getHttpServer())
      .get(`/cats/${id}`)
      .set(...TestEnd2EndUtils.AUTHORIZATION_HEADER)
      .expect(200)
    expect(response.body).toHaveProperty(TestUtils.nameOf<CatGetByIdOutput>('id'), id)
    expect(response.body).toHaveProperty(TestUtils.nameOf<CatGetByIdOutput>('name'), entity.name)
    expect(response.body).toHaveProperty(TestUtils.nameOf<CatGetByIdOutput>('breed'), entity.breed)
    expect(response.body).toHaveProperty(TestUtils.nameOf<CatGetByIdOutput>('age'), entity.age)
  })

  it('/PUT /cats/:id should update cat', async () => {
    const catFixture = new ZodMockSchema(CatCreateSchema)
    const entity = catFixture.generate()
    const createRes = await request(app.getHttpServer())
      .post('/cats')
      .set(...TestEnd2EndUtils.AUTHORIZATION_HEADER)
      .send(entity)
      .expect(201)

    const id = createRes.body.id

    const update = {
      name: TestUtils.faker.animal.cat(),
      breed: TestUtils.faker.animal.cat(),
      age: TestUtils.faker.number.int({ min: 1, max: 20 })
    }

    const response = await request(app.getHttpServer())
      .put(`/cats/${id}`)
      .set(...TestEnd2EndUtils.AUTHORIZATION_HEADER)
      .send(update)
      .expect(200)
    expect(response.body).toHaveProperty(TestUtils.nameOf<CatUpdateOutput>('id'), id)
    expect(response.body).toHaveProperty(TestUtils.nameOf<CatUpdateOutput>('name'), update.name)
    expect(response.body).toHaveProperty(TestUtils.nameOf<CatUpdateOutput>('breed'), update.breed)
    expect(response.body).toHaveProperty(TestUtils.nameOf<CatUpdateOutput>('age'), update.age)
  })

  it('/DELETE /cats/:id should delete cat', async () => {
    const catFixture = new ZodMockSchema(CatCreateSchema)
    const entity = catFixture.generate()
    const createRes = await request(app.getHttpServer())
      .post('/cats')
      .set(...TestEnd2EndUtils.AUTHORIZATION_HEADER)
      .send(entity)
      .expect(201)

    const id = createRes.body.id
    const response = await request(app.getHttpServer())
      .delete(`/cats/${id}`)
      .set(...TestEnd2EndUtils.AUTHORIZATION_HEADER)
    expect([200, 204]).toContain(response.status)
  })

  afterAll(async () => {
    await mongoContainer.close()
    await redisContainer.close()
    await postgresContainer.close()
    await app.close()
  })
})
