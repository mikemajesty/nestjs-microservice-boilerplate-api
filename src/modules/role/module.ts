/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/modules/module.md
 */
import { Module } from '@nestjs/common'
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { IPermissionRepository } from '@/core/permission/repository/permission'
import { RoleEntity } from '@/core/role/entity/role'
import { IRoleRepository } from '@/core/role/repository/role'
import { RoleAddPermissionUsecase } from '@/core/role/use-cases/role-add-permission'
import { RoleCreateUsecase } from '@/core/role/use-cases/role-create'
import { RoleDeleteUsecase } from '@/core/role/use-cases/role-delete'
import { RoleDeletePermissionUsecase } from '@/core/role/use-cases/role-delete-permission'
import { RoleGetByIdUsecase } from '@/core/role/use-cases/role-get-by-id'
import { RoleListUsecase } from '@/core/role/use-cases/role-list'
import { RoleUpdateUsecase } from '@/core/role/use-cases/role-update'
import { CacheRedisModule } from '@/infra/cache/redis'
import { RoleSchema } from '@/infra/database/postgres/schemas/role'
import { ILoggerAdapter, LoggerModule } from '@/infra/logger'
import { TokenLibModule } from '@/libs/token'

import { PermissionModule } from '../permission/module'
import { RoleController } from './controller'
import {
  IRoleAddPermission,
  IRoleCreate,
  IRoleDelete,
  IRoleDeletePermission,
  IRoleGetById,
  IRoleList,
  IRoleUpdate
} from './interfaces'
import { RoleRepository } from './repository'

@Module({
  imports: [TokenLibModule, LoggerModule, CacheRedisModule, TypeOrmModule.forFeature([RoleSchema]), PermissionModule],
  controllers: [RoleController],
  providers: [
    {
      provide: IRoleRepository,
      useFactory: (repository: Repository<RoleSchema & RoleEntity>) => {
        return new RoleRepository(repository)
      },
      inject: [getRepositoryToken(RoleSchema)]
    },
    {
      provide: IRoleCreate,
      useFactory: (logger: ILoggerAdapter, repository: IRoleRepository) => new RoleCreateUsecase(repository, logger),
      inject: [ILoggerAdapter, IRoleRepository]
    },
    {
      provide: IRoleUpdate,
      useFactory: (logger: ILoggerAdapter, repository: IRoleRepository) => new RoleUpdateUsecase(repository, logger),
      inject: [ILoggerAdapter, IRoleRepository]
    },
    {
      provide: IRoleGetById,
      useFactory: (repository: IRoleRepository) => new RoleGetByIdUsecase(repository),
      inject: [IRoleRepository]
    },
    {
      provide: IRoleList,
      useFactory: (repository: IRoleRepository) => new RoleListUsecase(repository),
      inject: [IRoleRepository]
    },
    {
      provide: IRoleDelete,
      useFactory: (repository: IRoleRepository) => new RoleDeleteUsecase(repository),
      inject: [IRoleRepository]
    },
    {
      provide: IRoleAddPermission,
      useFactory: (repository: IRoleRepository, permissionRepository: IPermissionRepository) =>
        new RoleAddPermissionUsecase(repository, permissionRepository),
      inject: [IRoleRepository, IPermissionRepository]
    },
    {
      provide: IRoleDeletePermission,
      useFactory: (repository: IRoleRepository, permissionRepository: IPermissionRepository) =>
        new RoleDeletePermissionUsecase(repository, permissionRepository),
      inject: [IRoleRepository, IPermissionRepository]
    }
  ],
  exports: [IRoleRepository]
})
export class RoleModule {}
