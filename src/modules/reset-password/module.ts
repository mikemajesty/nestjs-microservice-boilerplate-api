import { Module } from '@nestjs/common';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ResetPasswordEntity } from '@/core/reset-password/entity/reset-password';
import { IResetPasswordRepository } from '@/core/reset-password/repository/reset-password';
import { ResetPasswordConfirmUsecase } from '@/core/reset-password/use-cases/reset-password-confirm';
import { ResetPasswordSendEmailUsecase } from '@/core/reset-password/use-cases/reset-password-send-email';
import { IUserRepository } from '@/core/user/repository/user';
import { RedisCacheModule } from '@/infra/cache/redis';
import { ResetPasswordSchema } from '@/infra/database/postgres/schemas/reset-password';
import { LoggerModule } from '@/infra/logger';
import { ISecretsAdapter, SecretsModule } from '@/infra/secrets';
import { EventLibModule, IEventAdapter } from '@/libs/event';
import { ITokenAdapter, TokenLibModule } from '@/libs/token';

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
    EventLibModule,
    TypeOrmModule.forFeature([ResetPasswordSchema])
  ],
  controllers: [ResetPasswordController],
  providers: [
    {
      provide: IResetPasswordRepository,
      useFactory: (repository: Repository<ResetPasswordSchema & ResetPasswordEntity>) => {
        return new ResetPasswordRepository(repository);
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
        return new ResetPasswordSendEmailUsecase(resetpasswordtokenRepository, userRepository, token, event, secret);
      },
      inject: [IResetPasswordRepository, IUserRepository, ITokenAdapter, IEventAdapter, ISecretsAdapter]
    },
    {
      provide: IConfirmResetPasswordAdapter,
      useFactory: (
        resetpasswordtokenRepository: IResetPasswordRepository,
        userRepository: IUserRepository,
        token: ITokenAdapter,
        event: IEventAdapter
      ) => {
        return new ResetPasswordConfirmUsecase(resetpasswordtokenRepository, userRepository, token, event);
      },
      inject: [IResetPasswordRepository, IUserRepository, ITokenAdapter, IEventAdapter]
    }
  ],
  exports: [IResetPasswordRepository, ISendEmailResetPasswordAdapter]
})
export class ResetPasswordModule {}
