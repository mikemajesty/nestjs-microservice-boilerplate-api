import { Module } from '@nestjs/common';

import { LogoutUsecase } from '@/core/user/use-cases/user-logout';
import { ICacheAdapter } from '@/infra/cache';
import { RedisCacheModule } from '@/infra/cache/redis';
import { ISecretsAdapter, SecretsModule } from '@/infra/secrets';

import { ILogoutAdapter } from './adapter';
import { LogoutController } from './controller';

@Module({
  imports: [RedisCacheModule, SecretsModule],
  controllers: [LogoutController],
  providers: [
    {
      provide: ILogoutAdapter,
      useFactory: (cache: ICacheAdapter, secrets: ISecretsAdapter) => {
        return new LogoutUsecase(cache, secrets);
      },
      inject: [ICacheAdapter, ISecretsAdapter]
    }
  ],
  exports: [ILogoutAdapter]
})
export class LogoutModule {}
