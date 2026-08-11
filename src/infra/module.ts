import { Module } from '@nestjs/common'

import { MemoryCacheModule } from './cache/memory'
import { RedisCacheModule, RedisConnectionModule } from './cache/redis'
import { MongoDatabaseModule } from './database/mongo'
import { PostgresDatabaseModule } from './database/postgres/module'
import { EmailModule } from './email'
import { HttpModule } from './http'
import { LoggerModule } from './logger'
import { SecretsModule } from './secrets'

@Module({
  imports: [
    SecretsModule,
    MongoDatabaseModule,
    PostgresDatabaseModule,
    LoggerModule,
    HttpModule,
    RedisConnectionModule,
    RedisCacheModule,
    MemoryCacheModule,
    EmailModule
  ],
  exports: [
    SecretsModule,
    MongoDatabaseModule,
    PostgresDatabaseModule,
    LoggerModule,
    HttpModule,
    RedisConnectionModule,
    RedisCacheModule,
    MemoryCacheModule,
    EmailModule
  ]
})
export class InfraModule {}
