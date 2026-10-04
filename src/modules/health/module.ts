/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/modules/module.md
 */
import { Module } from '@nestjs/common'
import { getConnectionToken } from '@nestjs/mongoose'
import { getDataSourceToken } from '@nestjs/typeorm'
import { Redis } from 'ioredis'
import { Connection } from 'mongoose'
import { DataSource } from 'typeorm'

import { ICacheAdapter } from '@/infra/cache'
import { CacheRedisModule } from '@/infra/cache/redis'
import { MongoConnectionName, PostgresConnectionName } from '@/infra/database'
import { PostgresDatabaseModule } from '@/infra/database/postgres'
import { ILoggerAdapter, LoggerModule } from '@/infra/logger'
import { ISecretsAdapter, SecretsModule } from '@/infra/secrets'

import { HealthController, RootHealthController } from './controller'
import { HealthService, IHealthAdapter } from './service'

@Module({
  imports: [LoggerModule, PostgresDatabaseModule, CacheRedisModule, SecretsModule],
  controllers: [HealthController, RootHealthController],
  providers: [
    {
      provide: IHealthAdapter,
      useFactory: async (
        connection: Connection,
        dataSource: DataSource,
        cache: ICacheAdapter<Redis>,
        logger: ILoggerAdapter,
        secrets: ISecretsAdapter
      ) => {
        const service = new HealthService(logger, secrets)
        service.postgres = dataSource
        service.mongo = connection
        service.redis = cache
        return service
      },
      inject: [
        getConnectionToken(MongoConnectionName.MONGO),
        getDataSourceToken(PostgresConnectionName.POSTGRES),
        ICacheAdapter<Redis>,
        ILoggerAdapter,
        ISecretsAdapter
      ]
    }
  ],
  exports: [IHealthAdapter]
})
export class HealthModule {}
