/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/modules/module.md
 */
import { Module } from '@nestjs/common'
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { IRoleRepository } from '@/core/role/repository/role'
import { UserEntity } from '@/core/user/entity/user'
import { IUserRepository } from '@/core/user/repository/user'
import { UserChangePasswordUsecase } from '@/core/user/use-cases/user-change-password'
import { UserCreateUsecase } from '@/core/user/use-cases/user-create'
import { UserDeleteUsecase } from '@/core/user/use-cases/user-delete'
import { UserGetByIdUsecase } from '@/core/user/use-cases/user-get-by-id'
import { UserListUsecase } from '@/core/user/use-cases/user-list'
import { UserUpdateUsecase } from '@/core/user/use-cases/user-update'
import { CacheRedisModule } from '@/infra/cache/redis'
import { UserSchema } from '@/infra/database/postgres/schemas/user'
import { ILoggerAdapter, LoggerModule } from '@/infra/logger'
import { SecretsModule } from '@/infra/secrets'
import { EventLibModule, IEventAdapter } from '@/libs/event'
import { TokenLibModule } from '@/libs/token'

import { RoleModule } from '../role/module'
import { UserController } from './controller'
import { IUserChangePassword, IUserCreate, IUserDelete, IUserGetById, IUserList, IUserUpdate } from './interfaces'
import { UserRepository } from './repository'

@Module({
  imports: [
    TokenLibModule,
    SecretsModule,
    LoggerModule,
    CacheRedisModule,
    EventLibModule,
    TypeOrmModule.forFeature([UserSchema]),
    RoleModule
  ],
  controllers: [UserController],
  providers: [
    {
      provide: IUserRepository,
      useFactory: (repository: Repository<UserSchema & UserEntity>) => {
        return new UserRepository(repository)
      },
      inject: [getRepositoryToken(UserSchema)]
    },
    {
      provide: IUserCreate,
      useFactory: (
        userRepository: IUserRepository,
        loggerService: ILoggerAdapter,
        event: IEventAdapter,
        roleRepository: IRoleRepository
      ) => {
        return new UserCreateUsecase(userRepository, loggerService, event, roleRepository)
      },
      inject: [IUserRepository, ILoggerAdapter, IEventAdapter, IRoleRepository]
    },
    {
      provide: IUserUpdate,
      useFactory: (userRepository: IUserRepository, loggerService: ILoggerAdapter, roleRepository: IRoleRepository) => {
        return new UserUpdateUsecase(userRepository, loggerService, roleRepository)
      },
      inject: [IUserRepository, ILoggerAdapter, IRoleRepository]
    },
    {
      provide: IUserList,
      useFactory: (userRepository: IUserRepository) => {
        return new UserListUsecase(userRepository)
      },
      inject: [IUserRepository]
    },
    {
      provide: IUserDelete,
      useFactory: (userRepository: IUserRepository) => {
        return new UserDeleteUsecase(userRepository)
      },
      inject: [IUserRepository]
    },
    {
      provide: IUserGetById,
      useFactory: (userRepository: IUserRepository) => {
        return new UserGetByIdUsecase(userRepository)
      },
      inject: [IUserRepository]
    },
    {
      provide: IUserChangePassword,
      useFactory: (userRepository: IUserRepository) => {
        return new UserChangePasswordUsecase(userRepository)
      },
      inject: [IUserRepository]
    }
  ],
  exports: [IUserRepository, IUserCreate, IUserUpdate, IUserList, IUserDelete, IUserGetById]
})
export class UserModule {}
