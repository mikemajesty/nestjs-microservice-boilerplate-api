import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import jwt from 'jsonwebtoken'
import request from 'supertest'

import { IResetPasswordRepository } from '@/core/reset-password/repository/reset-password'
import { IUserRepository } from '@/core/user/repository/user'
import { TokenSignOutput } from '@/libs/token'
import { ITokenAdapter } from '@/libs/token/adapter'
import { ApiBadRequestException, ApiNotFoundException } from '@/utils/exception'
import { UserRequest } from '@/utils/request'
import { TestPostgresContainer, TestRedisContainer } from '@/utils/test/e2e/containers'
import { ResetPasswordFixture } from '@/utils/test/e2e/fixtures/reset-password'
import { UserFixture } from '@/utils/test/e2e/fixtures/user'
import { TestEnd2EndUtils } from '@/utils/test/e2e/utils'
import { TestUtils } from '@/utils/test/utils'

import { ResetPasswordController } from '../controller'
import { ResetPasswordModule } from '../module'

describe(ResetPasswordController.name, () => {
  let app: INestApplication
  let userRepository: IUserRepository
  let resetPasswordRepository: IResetPasswordRepository

  const userFixture = new UserFixture()
  const resetPasswordFixture = new ResetPasswordFixture()
  const redisContainer = new TestRedisContainer()
  const postgresContainer = new TestPostgresContainer()

  beforeAll(async () => {
    const { postgresConfig } = await postgresContainer.getPostgres()

    const moduleRef = await Test.createTestingModule({
      imports: [ResetPasswordModule, TestEnd2EndUtils.getPostgresModule(postgresContainer, postgresConfig)]
    })
      .overrideProvider(ITokenAdapter)
      .useValue({
        sign: TestUtils.mockReturnValue<TokenSignOutput>({
          token: jwt.sign({ id: userFixture.entity.id }, process.env.JWT_SECRET as string, { expiresIn: '1h' })
        }),
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

    userRepository = moduleRef.get(IUserRepository)
    resetPasswordRepository = moduleRef.get(IResetPasswordRepository)

    await userFixture.up(userRepository)
  })

  afterEach(async () => {
    await resetPasswordFixture.down(resetPasswordRepository)
    await userFixture.down(userRepository)
  })

  afterAll(async () => {
    await resetPasswordFixture.down(resetPasswordRepository)
    await userFixture.down(userRepository)
    await postgresContainer.close()
    await redisContainer.close()
    await app.close()
  })

  it('/POST /reset-password/send-email should send email for valid user', async () => {
    const user = userFixture.entity
    const response = await request(app.getHttpServer())
      .post('/reset-password/send-email')
      .send({ email: user.email })
      .expect(201)
    expect(response.body).toEqual({})
  })

  it('/POST /reset-password/send-email should fail for non-existent user', async () => {
    await request(app.getHttpServer())
      .post('/reset-password/send-email')
      .send({ email: 'notfound@example.com' })
      .expect(ApiNotFoundException.STATUS)
  })

  it('/PUT /reset-password/:token should fail with invalid token', async () => {
    await request(app.getHttpServer())
      .put('/reset-password/invalidtoken')
      .send({ password: '123456', confirmPassword: '123456' })
      .expect(ApiNotFoundException.STATUS)
  })

  it('/PUT /reset-password/:token should fail with different passwords', async () => {
    await request(app.getHttpServer())
      .put('/reset-password/faketoken')
      .send({ password: '123456', confirmPassword: 'wrong' })
      .expect(ApiBadRequestException.STATUS)
  })
})
