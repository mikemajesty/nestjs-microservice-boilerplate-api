import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { IPermissionRepository } from '@/core/permission/repository/permission';
import { RoleEntity } from '@/core/role/entity/role';
import { IRoleRepository } from '@/core/role/repository/role';
import { RoleAddPermissionUsecase } from '@/core/role/use-cases/role-add-permission';
import { RoleCreateUsecase } from '@/core/role/use-cases/role-create';
import { RoleDeleteUsecase } from '@/core/role/use-cases/role-delete';
import { RoleDeletePermissionUsecase } from '@/core/role/use-cases/role-delete-permission';
import { RoleGetByIdUsecase } from '@/core/role/use-cases/role-get-by-id';
import { RoleListUsecase } from '@/core/role/use-cases/role-list';
import { RoleUpdateUsecase } from '@/core/role/use-cases/role-update';
import { RedisCacheModule } from '@/infra/cache/redis';
import { RoleSchema } from '@/infra/database/postgres/schemas/role';
import { ILoggerAdapter, LoggerModule } from '@/infra/logger';
import { TokenLibModule } from '@/libs/token';
import { AuthenticationMiddleware } from '@/middlewares/middlewares';

import { PermissionModule } from '../permission/module';
import {
  IRoleAddPermissionAdapter,
  IRoleCreateAdapter,
  IRoleDeleteAdapter,
  IRoleDeletePermissionAdapter,
  IRoleGetByIdAdapter,
  IRoleListAdapter,
  IRoleUpdateAdapter
} from './adapter';
import { RoleController } from './controller';
import { RoleRepository } from './repository';

@Module({
  imports: [TokenLibModule, LoggerModule, RedisCacheModule, TypeOrmModule.forFeature([RoleSchema]), PermissionModule],
  controllers: [RoleController],
  providers: [
    {
      provide: IRoleRepository,
      useFactory: (repository: Repository<RoleSchema & RoleEntity>) => {
        return new RoleRepository(repository);
      },
      inject: [getRepositoryToken(RoleSchema)]
    },
    {
      provide: IRoleCreateAdapter,
      useFactory: (logger: ILoggerAdapter, repository: IRoleRepository) => new RoleCreateUsecase(repository, logger),
      inject: [ILoggerAdapter, IRoleRepository]
    },
    {
      provide: IRoleUpdateAdapter,
      useFactory: (logger: ILoggerAdapter, repository: IRoleRepository) => new RoleUpdateUsecase(repository, logger),
      inject: [ILoggerAdapter, IRoleRepository]
    },
    {
      provide: IRoleGetByIdAdapter,
      useFactory: (repository: IRoleRepository) => new RoleGetByIdUsecase(repository),
      inject: [IRoleRepository]
    },
    {
      provide: IRoleListAdapter,
      useFactory: (repository: IRoleRepository) => new RoleListUsecase(repository),
      inject: [IRoleRepository]
    },
    {
      provide: IRoleDeleteAdapter,
      useFactory: (repository: IRoleRepository) => new RoleDeleteUsecase(repository),
      inject: [IRoleRepository]
    },
    {
      provide: IRoleAddPermissionAdapter,
      useFactory: (repository: IRoleRepository, permissionRepository: IPermissionRepository) =>
        new RoleAddPermissionUsecase(repository, permissionRepository),
      inject: [IRoleRepository, IPermissionRepository]
    },
    {
      provide: IRoleDeletePermissionAdapter,
      useFactory: (repository: IRoleRepository, permissionRepository: IPermissionRepository) =>
        new RoleDeletePermissionUsecase(repository, permissionRepository),
      inject: [IRoleRepository, IPermissionRepository]
    }
  ],
  exports: [IRoleRepository]
})
export class RoleModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthenticationMiddleware).forRoutes(RoleController);
  }
}
