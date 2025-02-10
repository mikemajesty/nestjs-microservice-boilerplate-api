import { Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { getDataSourceToken } from '@nestjs/typeorm';
import { Connection } from 'mongoose';
import { RedisClientType } from 'redis';
import { DataSource } from 'typeorm';

import { ICacheAdapter } from '@/infra/cache';
import { RedisCacheModule } from '@/infra/cache/redis';
import { ConnectionName } from '@/infra/database/enum';
import { PostgresDatabaseModule } from '@/infra/database/postgres';
import { ILoggerAdapter, LoggerModule } from '@/infra/logger';
import { ISecretsAdapter, SecretsModule } from '@/infra/secrets';

import { IHealthAdapter } from './adapter';
import { HealthController } from './controller';
import { HealthService } from './service';

@Module({
  imports: [LoggerModule, PostgresDatabaseModule, RedisCacheModule, SecretsModule],
  controllers: [HealthController],
  providers: [
    {
      provide: IHealthAdapter,
      useFactory: async (
        connection: Connection,
        dataSource: DataSource,
        cache: ICacheAdapter<RedisClientType>,
        logger: ILoggerAdapter,
        secret: ISecretsAdapter
      ) => {
        const service = new HealthService(logger, secret);
        service.postgres = dataSource;
        service.mongo = connection;
        service.redis = cache;
        return service;
      },
      inject: [
        getConnectionToken(ConnectionName.CATS),
        getDataSourceToken(),
        ICacheAdapter<RedisClientType>,
        ILoggerAdapter,
        ISecretsAdapter
      ]
    }
  ],
  exports: [IHealthAdapter]
})
export class HealthModule {}
