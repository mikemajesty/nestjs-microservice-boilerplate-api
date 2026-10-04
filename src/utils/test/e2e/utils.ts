import { INestApplication, Type } from '@nestjs/common'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import { TestingModule } from '@nestjs/testing'
import { TypeOrmModule } from '@nestjs/typeorm'
import { FastifyRequest } from 'fastify'
import { DataSourceOptions } from 'typeorm'

import { UserEntity } from '@/core/user/entity/user'
import { PostgresConnectionName } from '@/infra/database'
import { AlertController } from '@/modules/alert/controller'
import { CatController } from '@/modules/cat/controller'
import { HealthController } from '@/modules/health/controller'
import { LoginController } from '@/modules/login/controller'
import { LogoutController } from '@/modules/logout/controller'
import { PermissionController } from '@/modules/permission/controller'
import { ResetPasswordController } from '@/modules/reset-password/controller'
import { RoleController } from '@/modules/role/controller'
import { UserController } from '@/modules/user/controller'
import { PERMISSION_GUARD } from '@/utils/decorators'
import { ApiRequest } from '@/utils/request'

import { MockUtils } from '../mock'
import { TestPostgresContainer } from './containers'

export class TestEnd2EndUtils {
  static readonly CONTROLLERS: Type[] = [
    CatController,
    UserController,
    RoleController,
    PermissionController,
    LogoutController,
    LoginController,
    HealthController,
    ResetPasswordController,
    AlertController
  ]

  /**
   * reads the @Permission(...) metadata directly from a controller's prototype.
   * works without any NestJS DI/app running, since SetMetadata writes via
   * Reflect.defineMetadata at class-definition time (import time).
   */
  static getControllerPermissions(controller: Type): string[] {
    const prototype = controller.prototype as Record<string, unknown>
    const permissions: string[] = []

    for (const methodName of Object.getOwnPropertyNames(prototype)) {
      if (methodName === 'constructor') continue

      const handler = prototype[methodName]
      if (typeof handler !== 'function') continue

      const permission = Reflect.getMetadata(PERMISSION_GUARD, handler) as string | undefined
      if (permission) permissions.push(permission)
    }

    return permissions
  }

  static getPermissions(controllers: Type[]): PermisisonRequestMinimal[] {
    const names = new Set(controllers.flatMap((controller) => TestEnd2EndUtils.getControllerPermissions(controller)))
    return [...names].map((name) => ({ name }))
  }

  static readonly ALL_PERMISSIONS: PermisisonRequestMinimal[] = TestEnd2EndUtils.getPermissions(
    TestEnd2EndUtils.CONTROLLERS
  )

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
      name: PostgresConnectionName.POSTGRES,
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
