import { INestApplication } from '@nestjs/common'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import { TestingModule } from '@nestjs/testing'
import { TypeOrmModule } from '@nestjs/typeorm'
import { FastifyRequest } from 'fastify'
import { DataSourceOptions } from 'typeorm'

import { UserEntity } from '@/core/user/entity/user'
import { AlertController } from '@/modules/alert/controller'
import { CatController } from '@/modules/cat/controller'
import { HealthController } from '@/modules/health/controller'
import { LoginController } from '@/modules/login/controller'
import { LogoutController } from '@/modules/logout/controller'
import { PermissionController } from '@/modules/permission/controller'
import { ResetPasswordController } from '@/modules/reset-password/controller'
import { RoleController } from '@/modules/role/controller'
import { UserController } from '@/modules/user/controller'
import { ApiRequest } from '@/utils/request'

import { MockUtils } from '../mock'
import { TestPostgresContainer } from './containers'

export class TestEnd2EndUtils {
  static readonly PERMISSIONS_BY_CONTROLLER: { [ControllerType: string]: PermisisonRequestMinimal[] } = {
    [CatController.name]: [
      { name: 'cat:create' },
      { name: 'cat:update' },
      { name: 'cat:getbyid' },
      { name: 'cat:list' },
      { name: 'cat:delete' }
    ],
    [UserController.name]: [
      { name: 'user:create' },
      { name: 'user:update' },
      { name: 'user:list' },
      { name: 'user:getbyid' },
      { name: 'user:changepassword' },
      { name: 'user:delete' }
    ],
    [RoleController.name]: [
      { name: 'role:create' },
      { name: 'role:update' },
      { name: 'role:getbyid' },
      { name: 'role:list' },
      { name: 'role:delete' },
      { name: 'role:addpermission' },
      { name: 'role:deletepermission' }
    ],
    [PermissionController.name]: [
      { name: 'permission:create' },
      { name: 'permission:update' },
      { name: 'permission:routes-view' },
      { name: 'permission:getbyid' },
      { name: 'permission:list' },
      { name: 'permission:delete' }
    ],
    [LogoutController.name]: [{ name: 'user:logout' }],
    [LoginController.name]: [],
    [HealthController.name]: [],
    [ResetPasswordController.name]: [],
    [AlertController.name]: []
  } as const

  // @todo: ver se é possivel chamar o routes-explorer para popular todas as permissões dinamicamente
  static readonly ALL_PERMISSIONS: PermisisonRequestMinimal[] = Object.values(
    TestEnd2EndUtils.PERMISSIONS_BY_CONTROLLER
  ).flat()

  static readonly AUTHORIZATION_HEADER: [string, string] = ['Authorization', 'Bearer fake-token']

  static async createApp(moduleRef: TestingModule): Promise<NestFastifyApplication> {
    const app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter())

    TestEnd2EndUtils.addTracing(app)

    await app.init()
    await app.getHttpAdapter().getInstance().ready()

    return app
  }

  static addTracing(app: INestApplication) {
    const fastify = app.getHttpAdapter().getInstance()

    fastify.addHook('preHandler', async (request: FastifyRequest) => {
      const reqWithTracing = request as FastifyRequest & { tracing?: ApiRequest['tracing'] }
      reqWithTracing.tracing = MockUtils.Tracing().tracing
    })
  }

  static getPostgresModule(postgresContainer: TestPostgresContainer, postgresConfig: DataSourceOptions) {
    return TypeOrmModule.forRootAsync({
      useFactory: async () => {
        return postgresConfig
      },
      async dataSourceFactory(options) {
        return await postgresContainer.getDataSource(options)
      }
    })
  }
}

export type PermisisonRequestMinimal = {
  name: string
}

export type RoleMockRequestMinimal = {
  permissions?: PermisisonRequestMinimal[]
}

export type UserMockRequest = Pick<UserEntity, 'email'> & {
  roles?: RoleMockRequestMinimal[]
}
