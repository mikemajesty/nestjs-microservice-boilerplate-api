/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/modules/module.md
 */
import { Module } from '@nestjs/common'
import { DiscoveryModule } from '@nestjs/core'
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { PermissionEntity } from '@/core/permission/entity/permission'
import { IPermissionRepository } from '@/core/permission/repository/permission'
import { PermissionCreateUsecase } from '@/core/permission/use-cases/permission-create'
import { PermissionDeleteUsecase } from '@/core/permission/use-cases/permission-delete'
import { PermissionGetByIdUsecase } from '@/core/permission/use-cases/permission-get-by-id'
import { PermissionListUsecase } from '@/core/permission/use-cases/permission-list'
import { PermissionUpdateUsecase } from '@/core/permission/use-cases/permission-update'
import { CacheAsideModule, ICacheAsideAdapter } from '@/infra/cache/aside'
import { CacheRedisModule } from '@/infra/cache/redis'
import { PostgresConnectionName } from '@/infra/database'
import { PermissionSchema } from '@/infra/database/postgres/schemas/permission'
import { ILoggerAdapter, LoggerModule } from '@/infra/logger'
import { TokenLibModule } from '@/libs/token'

import { PermissionController } from './controller'
import {
  IPermissionCreate,
  IPermissionDelete,
  IPermissionGetById,
  IPermissionList,
  IPermissionUpdate
} from './interfaces'
import { PermissionRepository } from './repository'
import { RoutesExplorer } from './routes'

@Module({
  imports: [
    TokenLibModule,
    LoggerModule,
    CacheRedisModule,
    TypeOrmModule.forFeature([PermissionSchema], PostgresConnectionName.POSTGRES),
    DiscoveryModule,
    CacheAsideModule
  ],
  controllers: [PermissionController],
  providers: [
    RoutesExplorer,
    {
      provide: IPermissionRepository,
      useFactory: (repository: Repository<PermissionSchema & PermissionEntity>) => {
        return new PermissionRepository(repository)
      },
      inject: [getRepositoryToken(PermissionSchema, PostgresConnectionName.POSTGRES)]
    },
    {
      provide: IPermissionCreate,
      useFactory: (logger: ILoggerAdapter, repository: IPermissionRepository) =>
        new PermissionCreateUsecase(repository, logger),
      inject: [ILoggerAdapter, IPermissionRepository]
    },
    {
      provide: IPermissionUpdate,
      useFactory: (logger: ILoggerAdapter, repository: IPermissionRepository, cacheAside: ICacheAsideAdapter) =>
        new PermissionUpdateUsecase(repository, logger, cacheAside),
      inject: [ILoggerAdapter, IPermissionRepository, ICacheAsideAdapter]
    },
    {
      provide: IPermissionGetById,
      useFactory: (repository: IPermissionRepository) => new PermissionGetByIdUsecase(repository),
      inject: [IPermissionRepository]
    },
    {
      provide: IPermissionList,
      useFactory: (repository: IPermissionRepository) => new PermissionListUsecase(repository),
      inject: [IPermissionRepository]
    },
    {
      provide: IPermissionDelete,
      useFactory: (repository: IPermissionRepository) => new PermissionDeleteUsecase(repository),
      inject: [IPermissionRepository]
    }
  ],
  exports: [IPermissionRepository]
})
export class PermissionModule {}
