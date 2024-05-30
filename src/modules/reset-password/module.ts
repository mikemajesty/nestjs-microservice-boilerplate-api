import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import mongoose, { Connection, PaginateModel, Schema } from 'mongoose';

import { IsLoggedMiddleware } from '@/common/middlewares';
import { IResetPasswordRepository } from '@/core/reset-password/repository/reset-password';
import { ConfirmResetPasswordUsecase } from '@/core/reset-password/use-cases/confirm';
import { SendEmailResetPasswordUsecase } from '@/core/reset-password/use-cases/send-email';
import { IUserRepository } from '@/core/user/repository/user';
import { RedisCacheModule } from '@/infra/cache/redis';
import { ConnectionName } from '@/infra/database/enum';
import {
  ResetPassword,
  ResetPasswordDocument,
  ResetPasswordSchema
} from '@/infra/database/mongo/schemas/reset-password';
import { LoggerModule } from '@/infra/logger';
import { ISecretsAdapter, SecretsModule } from '@/infra/secrets';
import { CryptoLibModule, ICryptoAdapter } from '@/libs/crypto';
import { EventLibModule, IEventAdapter } from '@/libs/event';
import { ITokenAdapter, TokenLibModule } from '@/libs/token';
import { MongoRepositoryModelSessionType } from '@/utils/database/mongoose';

import { UserModule } from '../user/module';
import { IConfirmResetPasswordAdapter, ISendEmailResetPasswordAdapter } from './adapter';
import { ResetPasswordController } from './controller';
import { ResetPasswordRepository } from './repository';

@Module({
  imports: [
    TokenLibModule,
    SecretsModule,
    LoggerModule,
    RedisCacheModule,
    UserModule,
    TokenLibModule,
    CryptoLibModule,
    EventLibModule
  ],
  controllers: [ResetPasswordController],
  providers: [
    {
      provide: IResetPasswordRepository,
      useFactory: async (connection: Connection) => {
        type Model = mongoose.PaginateModel<ResetPasswordDocument>;

        // use if you want transaction
        const repository: MongoRepositoryModelSessionType<PaginateModel<ResetPasswordDocument>> = connection.model<
          ResetPasswordDocument,
          Model
        >(ResetPassword.name, ResetPasswordSchema as Schema);

        repository.connection = connection;

        // use if you not want transaction
        // const repository: PaginateModel<ResetPasswordDocument> = connection.model<ResetPasswordDocument, Model>(ResetPassword.name, ResetPasswordSchema as Schema);

        return new ResetPasswordRepository(repository);
      },
      inject: [getConnectionToken(ConnectionName.USER)]
    },
    {
      provide: ISendEmailResetPasswordAdapter,
      useFactory: (
        resetpasswordtokenRepository: IResetPasswordRepository,
        userRepository: IUserRepository,
        token: ITokenAdapter,
        event: IEventAdapter,
        secret: ISecretsAdapter
      ) => {
        return new SendEmailResetPasswordUsecase(resetpasswordtokenRepository, userRepository, token, event, secret);
      },
      inject: [IResetPasswordRepository, IUserRepository, ITokenAdapter, IEventAdapter, ISecretsAdapter]
    },
    {
      provide: IConfirmResetPasswordAdapter,
      useFactory: (
        resetpasswordtokenRepository: IResetPasswordRepository,
        userRepository: IUserRepository,
        token: ITokenAdapter,
        event: IEventAdapter,
        crypto: ICryptoAdapter
      ) => {
        return new ConfirmResetPasswordUsecase(resetpasswordtokenRepository, userRepository, token, event, crypto);
      },
      inject: [IResetPasswordRepository, IUserRepository, ITokenAdapter, IEventAdapter, ICryptoAdapter]
    }
  ],
  exports: [IResetPasswordRepository, ISendEmailResetPasswordAdapter]
})
export class ResetPasswordModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(IsLoggedMiddleware).forRoutes(ResetPasswordController);
  }
}
