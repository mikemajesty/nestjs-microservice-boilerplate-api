import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'

import { IPermissionRepository } from '@/core/permission/repository/permission'
import { PermissionCreateOutput } from '@/core/permission/use-cases/permission-create'
import { PermissionListOutput } from '@/core/permission/use-cases/permission-list'
import { PermissionUpdateInput } from '@/core/permission/use-cases/permission-update'
import { IRoleRepository } from '@/core/role/repository/role'
import { IUserRepository } from '@/core/user/repository/user'
import { ITokenAdapter } from '@/libs/token'
import { UserModule } from '@/modules/user/module'
import { ApiConflictException, ApiNotFoundException } from '@/utils/exception'
import { UserRequest } from '@/utils/request'
import { TestPostgresContainer, TestRedisContainer } from '@/utils/test/e2e/containers'
import { PermissionFixture } from '@/utils/test/e2e/fixtures/permission'
import { RoleFixture } from '@/utils/test/e2e/fixtures/role'
import { UserFixture } from '@/utils/test/e2e/fixtures/user'
import { FixtureUtils } from '@/utils/test/e2e/fixtures/utils'
import { TestEnd2EndUtils } from '@/utils/test/e2e/utils'
import { TestUtils } from '@/utils/test/utils'

import { PermissionController } from '../controller'
import { PermissionModule } from '../module'

describe(PermissionController.name, () => {
  let app: INestApplication
  let permissionRepository: IPermissionRepository
  let roleRepository: IRoleRepository
  let userRepository: IUserRepository
  const permissionFixture = new PermissionFixture()
  const roleFixture = new RoleFixture()
  const userFixture = new UserFixture()
  const redisContainer = new TestRedisContainer()
  const postgresContainer = new TestPostgresContainer()

  beforeAll(async () => {
    const { postgresConfig } = await postgresContainer.getPostgres()

    const moduleRef = await Test.createTestingModule({
      imports: [UserModule, PermissionModule, TestEnd2EndUtils.getPostgresModule(postgresContainer, postgresConfig)]
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
    await redisContainer.close()
    await app.close()
  })

  const basePermission = permissionFixture.entity[0]

  it('/POST /permissions should create a permission', async () => {
    const name = 'permission:create:unique'
    const response = await request(app.getHttpServer())
      .post('/permissions')
      .set(...TestEnd2EndUtils.AUTHORIZATION_HEADER)
      .send({ name })
      .expect(201)
    expect(response.body).toHaveProperty(TestUtils.nameOf<PermissionCreateOutput>('id'))
    expect(response.body.name).toBe(name)
  })

  it('/POST /permissions should fail for duplicate', async () => {
    await request(app.getHttpServer())
      .post('/permissions')
      .set(...TestEnd2EndUtils.AUTHORIZATION_HEADER)
      .send({ name: basePermission.name })
      .expect(ApiConflictException.STATUS)
  })

  it('/GET /permissions should list permissions', async () => {
    const response = await request(app.getHttpServer())
      .get('/permissions')
      .set(...TestEnd2EndUtils.AUTHORIZATION_HEADER)
      .expect(200)
    expect(response.body).toHaveProperty(TestUtils.nameOf<PermissionListOutput>('docs'))
    expect(response.body).toHaveProperty(TestUtils.nameOf<PermissionListOutput>('limit'))
    expect(response.body).toHaveProperty(TestUtils.nameOf<PermissionListOutput>('page'))
    expect(response.body).toHaveProperty(TestUtils.nameOf<PermissionListOutput>('total'))
  })

  it('/GET /permissions/:id should get by id', async () => {
    const response = await request(app.getHttpServer())
      .get(`/permissions/${basePermission.id}`)
      .set(...TestEnd2EndUtils.AUTHORIZATION_HEADER)
      .expect(200)
    expect(response.body).toHaveProperty(TestUtils.nameOf<PermissionCreateOutput>('id'), basePermission.id)
    expect(response.body).toHaveProperty(TestUtils.nameOf<PermissionCreateOutput>('name'), basePermission.name)
  })

  it('/GET /permissions/:id should 404 for not found', async () => {
    await request(app.getHttpServer())
      .get(`/permissions/${TestUtils.mockUUID()}`)
      .set(...TestEnd2EndUtils.AUTHORIZATION_HEADER)
      .expect(ApiNotFoundException.STATUS)
  })

  it('/PUT /permissions/:id should update permission', async () => {
    const newName = basePermission.name + '-updated'
    const response = await request(app.getHttpServer())
      .put(`/permissions/${basePermission.id}`)
      .set(...TestEnd2EndUtils.AUTHORIZATION_HEADER)
      .send({ name: newName })
      .expect(200)
    expect(response.body).toHaveProperty(TestUtils.nameOf<PermissionCreateOutput>('id'), basePermission.id)
    expect(response.body).toHaveProperty(TestUtils.nameOf<PermissionCreateOutput>('name'), newName)
  })

  it('/PUT /permissions/:id should 404 for not found', async () => {
    await request(app.getHttpServer())
      .put(`/permissions/${TestUtils.mockUUID()}`)
      .set(...TestEnd2EndUtils.AUTHORIZATION_HEADER)
      .send({ name: basePermission.name } as PermissionUpdateInput)
      .expect(ApiNotFoundException.STATUS)
  })

  it('/DELETE /permissions/:id should delete permission', async () => {
    await permissionFixture.removeRole(basePermission, roleFixture.entity, roleRepository)
    const response = await request(app.getHttpServer())
      .delete(`/permissions/${basePermission.id}`)
      .set(...TestEnd2EndUtils.AUTHORIZATION_HEADER)
      .expect(200)
    expect(response.status).toEqual(200)
  })

  it('/DELETE /permissions/:id should 404 for not found', async () => {
    await request(app.getHttpServer())
      .delete(`/permissions/${TestUtils.mockUUID()}`)
      .set(...TestEnd2EndUtils.AUTHORIZATION_HEADER)
      .expect(ApiNotFoundException.STATUS)
  })
})
