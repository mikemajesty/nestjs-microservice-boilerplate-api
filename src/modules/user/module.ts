import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { IRoleRepository } from '@/core/role/repository/role';
import { UserEntity } from '@/core/user/entity/user';
import { IUserRepository } from '@/core/user/repository/user';
import { UserChangePasswordUsecase } from '@/core/user/use-cases/user-change-password';
import { UserCreateUsecase } from '@/core/user/use-cases/user-create';
import { UserDeleteUsecase } from '@/core/user/use-cases/user-delete';
import { UserGetByIdUsecase } from '@/core/user/use-cases/user-get-by-id';
import { UserListUsecase } from '@/core/user/use-cases/user-list';
import { UserUpdateUsecase } from '@/core/user/use-cases/user-update';
import { RedisCacheModule } from '@/infra/cache/redis';
import { UserSchema } from '@/infra/database/postgres/schemas/user';
import { ILoggerAdapter, LoggerModule } from '@/infra/logger';
import { SecretsModule } from '@/infra/secrets';
import { CryptoLibModule, ICryptoAdapter } from '@/libs/crypto';
import { EventLibModule, IEventAdapter } from '@/libs/event';
import { TokenLibModule } from '@/libs/token';
import { IsLoggedMiddleware } from '@/observables/middlewares';

import { RoleModule } from '../role/module';
import {
  IUserChangePasswordAdapter,
  IUserCreateAdapter,
  IUserDeleteAdapter,
  IUserGetByIDAdapter,
  IUserListAdapter,
  IUserUpdateAdapter
} from './adapter';
import { UserController } from './controller';
import { UserRepository } from './repository';

@Module({
  imports: [
    TokenLibModule,
    SecretsModule,
    LoggerModule,
    RedisCacheModule,
    CryptoLibModule,
    EventLibModule,
    TypeOrmModule.forFeature([UserSchema]),
    RoleModule
  ],
  controllers: [UserController],
  providers: [
    {
      provide: IUserRepository,
      useFactory: (repository: Repository<UserSchema & UserEntity>) => {
        return new UserRepository(repository);
      },
      inject: [getRepositoryToken(UserSchema)]
    },
    {
      provide: IUserCreateAdapter,
      useFactory: (
        userRepository: IUserRepository,
        loggerService: ILoggerAdapter,
        event: IEventAdapter,
        crypto: ICryptoAdapter,
        roleRpository: IRoleRepository
      ) => {
        return new UserCreateUsecase(userRepository, loggerService, event, crypto, roleRpository);
      },
      inject: [IUserRepository, ILoggerAdapter, IEventAdapter, ICryptoAdapter, IRoleRepository]
    },
    {
      provide: IUserUpdateAdapter,
      useFactory: (userRepository: IUserRepository, loggerService: ILoggerAdapter, role: IRoleRepository) => {
        return new UserUpdateUsecase(userRepository, loggerService, role);
      },
      inject: [IUserRepository, ILoggerAdapter, IRoleRepository]
    },
    {
      provide: IUserListAdapter,
      useFactory: (userRepository: IUserRepository) => {
        return new UserListUsecase(userRepository);
      },
      inject: [IUserRepository]
    },
    {
      provide: IUserDeleteAdapter,
      useFactory: (userRepository: IUserRepository) => {
        return new UserDeleteUsecase(userRepository);
      },
      inject: [IUserRepository]
    },
    {
      provide: IUserGetByIDAdapter,
      useFactory: (userRepository: IUserRepository) => {
        return new UserGetByIdUsecase(userRepository);
      },
      inject: [IUserRepository]
    },
    {
      provide: IUserChangePasswordAdapter,
      useFactory: (userRepository: IUserRepository, crypto: ICryptoAdapter) => {
        return new UserChangePasswordUsecase(userRepository, crypto);
      },
      inject: [IUserRepository, ICryptoAdapter]
    }
  ],
  exports: [
    IUserRepository,
    IUserCreateAdapter,
    IUserUpdateAdapter,
    IUserListAdapter,
    IUserDeleteAdapter,
    IUserGetByIDAdapter
  ]
})
export class UserModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(IsLoggedMiddleware).forRoutes(UserController);
  }
}
