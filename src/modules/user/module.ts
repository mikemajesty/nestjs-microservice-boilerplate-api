import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import mongoose, { Connection, PaginateModel, Schema } from 'mongoose';

import { IUserRepository } from '@/core/user/repository/user';
import { UserChangePasswordUsecase } from '@/core/user/use-cases/user-change-password';
import { UserCreateUsecase } from '@/core/user/use-cases/user-create';
import { UserDeleteUsecase } from '@/core/user/use-cases/user-delete';
import { UserGetByIdUsecase } from '@/core/user/use-cases/user-get-by-id';
import { UserListUsecase } from '@/core/user/use-cases/user-list';
import { UserUpdateUsecase } from '@/core/user/use-cases/user-update';
import { RedisCacheModule } from '@/infra/cache/redis';
import { ConnectionName } from '@/infra/database/enum';
import { User, UserDocument, UserSchema } from '@/infra/database/mongo/schemas/user';
import { ILoggerAdapter, LoggerModule } from '@/infra/logger';
import { SecretsModule } from '@/infra/secrets';
import { CryptoLibModule, ICryptoAdapter } from '@/libs/crypto';
import { EventLibModule, IEventAdapter } from '@/libs/event';
import { TokenLibModule } from '@/libs/token';
import { IsLoggedMiddleware } from '@/observables/middlewares';
import { MongoRepositoryModelSessionType } from '@/utils/database/mongoose';

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
  imports: [TokenLibModule, SecretsModule, LoggerModule, RedisCacheModule, CryptoLibModule, EventLibModule],
  controllers: [UserController],
  providers: [
    {
      provide: IUserRepository,
      useFactory: async (connection: Connection) => {
        type Model = mongoose.PaginateModel<UserDocument>;

        //  use if you want transaction
        const repository: MongoRepositoryModelSessionType<PaginateModel<UserDocument>> = connection.model<
          UserDocument,
          Model
        >(User.name, UserSchema as Schema);

        repository.connection = connection;

        // use if you not want transaction
        // const repository: PaginateModel<UserDocument> = connection.model<UserDocument, Model>(
        //   User.name,
        //   UserSchema as Schema
        // );

        return new UserRepository(repository);
      },
      inject: [getConnectionToken(ConnectionName.USER)]
    },
    {
      provide: IUserCreateAdapter,
      useFactory: (
        userRepository: IUserRepository,
        loggerService: ILoggerAdapter,
        crypto: ICryptoAdapter,
        event: IEventAdapter
      ) => {
        return new UserCreateUsecase(userRepository, loggerService, crypto, event);
      },
      inject: [IUserRepository, ILoggerAdapter, ICryptoAdapter, IEventAdapter]
    },
    {
      provide: IUserUpdateAdapter,
      useFactory: (userRepository: IUserRepository, loggerService: ILoggerAdapter) => {
        return new UserUpdateUsecase(userRepository, loggerService);
      },
      inject: [IUserRepository, ILoggerAdapter, ICryptoAdapter]
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
