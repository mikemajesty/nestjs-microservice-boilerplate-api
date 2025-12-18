/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/main/guides/modules/module.md
 */
import { Module } from '@nestjs/common'
import { getConnectionToken } from '@nestjs/mongoose'
import { getDataSourceToken } from '@nestjs/typeorm'
import { Connection } from 'mongoose'
import { RedisClientType } from 'redis'
import { DataSource } from 'typeorm'

import { ICacheAdapter } from '@/infra/cache'
import { RedisCacheModule } from '@/infra/cache/redis'
import { ConnectionName } from '@/infra/database/enum'
import { PostgresDatabaseModule } from '@/infra/database/postgres'
import { ILoggerAdapter, LoggerModule } from '@/infra/logger'

import { IHealthAdapter } from './adapter'
import { HealthController } from './controller'
import { HealthService } from './service'

@Module({
  imports: [LoggerModule, PostgresDatabaseModule, RedisCacheModule],
  controllers: [HealthController],
  providers: [
    {
      provide: IHealthAdapter,
      useFactory: async (
        connection: Connection,
        dataSource: DataSource,
        cache: ICacheAdapter<RedisClientType>,
        logger: ILoggerAdapter
      ) => {
        const service = new HealthService(logger)
        service.postgres = dataSource
        service.mongo = connection
        service.redis = cache
        return service
      },
      inject: [
        getConnectionToken(ConnectionName.CATS),
        getDataSourceToken(),
        ICacheAdapter<RedisClientType>,
        ILoggerAdapter
      ]
    }
  ],
  exports: [IHealthAdapter]
})
export class HealthModule {}
