import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ResetPasswordEntity } from '@/core/reset-password/entity/reset-password';
import { IResetPasswordRepository } from '@/core/reset-password/repository/reset-password';
import { ConfirmResetPasswordUsecase } from '@/core/reset-password/use-cases/confirm';
import { SendEmailResetPasswordUsecase } from '@/core/reset-password/use-cases/send-email';
import { IUserRepository } from '@/core/user/repository/user';
import { RedisCacheModule } from '@/infra/cache/redis';
import { ResetPasswordSchema } from '@/infra/database/postgres/schemas/resetPassword';
import { LoggerModule } from '@/infra/logger';
import { ISecretsAdapter, SecretsModule } from '@/infra/secrets';
import { CryptoLibModule, ICryptoAdapter } from '@/libs/crypto';
import { EventLibModule, IEventAdapter } from '@/libs/event';
import { ITokenAdapter, TokenLibModule } from '@/libs/token';
import { IsLoggedMiddleware } from '@/observables/middlewares';

import { UserModule } from '../user/module';
import { IConfirmResetPasswordAdapter, ISendEmailResetPasswordAdapter } from './adapter';
import { ResetPasswordController } from './controller';
import { UserResetPasswordRepository } from './repository';

@Module({
  imports: [
    TokenLibModule,
    SecretsModule,
    LoggerModule,
    RedisCacheModule,
    UserModule,
    TokenLibModule,
    CryptoLibModule,
    EventLibModule,
    TypeOrmModule.forFeature([ResetPasswordSchema])
  ],
  controllers: [ResetPasswordController],
  providers: [
    {
      provide: IResetPasswordRepository,
      useFactory: (repository: Repository<ResetPasswordSchema & ResetPasswordEntity>) => {
        return new UserResetPasswordRepository(repository);
      },
      inject: [getRepositoryToken(ResetPasswordSchema)]
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
