import { Module } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

import { ILoggerAdapter, LoggerModule } from '@/infra/logger';
import { ISecretsAdapter, SecretsModule } from '@/infra/secrets';

import { ICacheAdapter } from '../adapter';
import { RedisService } from './service';

@Module({
  imports: [LoggerModule, SecretsModule],
  providers: [
    {
      provide: ICacheAdapter,
      useFactory: async ({ REDIS_URL }: ISecretsAdapter, logger: ILoggerAdapter) => {
        const client = createClient({ url: REDIS_URL }) as RedisClientType;
        const cacheService = new RedisService(logger, client);
        await cacheService.connect();
        return cacheService;
      },
      inject: [ISecretsAdapter, ILoggerAdapter]
    }
  ],
  exports: [ICacheAdapter]
})
export class RedisCacheModule {}
