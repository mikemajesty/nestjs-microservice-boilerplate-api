import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import mongoose, { Connection, PaginateModel, Schema } from 'mongoose';

import { IsLoggedMiddleware } from '@/common/middlewares';
import { IUserRepository } from '@/core/user/repository/user';
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
import { TokenModule } from '@/libs/auth';
import { CryptoLibModule, ICryptoAdapter } from '@/libs/crypto';
import { MongoRepositoryModelSessionType } from '@/utils/database/mongoose';

import {
  IUserCreateAdapter,
  IUserDeleteAdapter,
  IUserGetByIDAdapter,
  IUserListAdapter,
  IUserUpdateAdapter
} from './adapter';
import { UserController } from './controller';
import { UserRepository } from './repository';

@Module({
  imports: [TokenModule, SecretsModule, LoggerModule, RedisCacheModule, CryptoLibModule],
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
      useFactory: (userRepository: IUserRepository, loggerService: ILoggerAdapter, crypto: ICryptoAdapter) => {
        return new UserCreateUsecase(userRepository, loggerService, crypto);
      },
      inject: [IUserRepository, ILoggerAdapter, ICryptoAdapter]
    },
    {
      provide: IUserUpdateAdapter,
      useFactory: (userRepository: IUserRepository, loggerService: ILoggerAdapter, crypto: ICryptoAdapter) => {
        return new UserUpdateUsecase(userRepository, loggerService, crypto);
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
