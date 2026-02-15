import { FactoryProvider, INestApplication, InjectionToken } from '@nestjs/common'
import { APP_GUARD, Reflector } from '@nestjs/core'
import { TypeOrmModule } from '@nestjs/typeorm'
import { NextFunction } from 'express'
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions'

import { UserEntity } from '@/core/user/entity/user'
import { IUserRepository } from '@/core/user/repository/user'
import { AuthorizationRoleGuard } from '@/middlewares/guards/authorization.guard'
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

import { TestUtils } from '../utils'
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

  static readonly ALL_PERMISSIONS: PermisisonRequestMinimal[] = Object.values(
    TestEnd2EndUtils.PERMISSIONS_BY_CONTROLLER
  ).flat()

  static readonly AUTHORIZATION_HEADER: [string, string] = ['Authorization', 'Bearer fake-token']

  static addTracing(app: INestApplication) {
    app.use((req: ApiRequest, res: Response, next: NextFunction) => {
      req.tracing = TestUtils.getMockTracing().tracing
      next()
    })
  }

  static getPostgresModule(postgresContainer: TestPostgresContainer, postgresConfig: PostgresConnectionOptions) {
    return TypeOrmModule.forRootAsync({
      useFactory: async () => {
        return postgresConfig
      },
      async dataSourceFactory(options) {
        return await postgresContainer.getDataSource(options)
      }
    })
  }

  static getGuardProvider(injectList: InjectionToken[]): FactoryProvider {
    return {
      provide: APP_GUARD,
      useFactory: (repository: IUserRepository) => {
        return new AuthorizationRoleGuard(new Reflector(), repository)
      },
      inject: injectList
    } as FactoryProvider
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
