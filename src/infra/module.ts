import { Module } from '@nestjs/common'

import { CacheAsideModule } from './cache/aside/module'
import { CacheMemoryModule } from './cache/memory'
import { CacheRedisModule } from './cache/redis'
import { MongoDatabaseModule } from './database/mongo'
import { PostgresDatabaseModule } from './database/postgres/module'
import { DistributedLockModule } from './distributed-lock'
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
    CacheRedisModule,
    CacheMemoryModule,
    EmailModule,
    DistributedLockModule,
    CacheAsideModule
  ],
  exports: [
    SecretsModule,
    MongoDatabaseModule,
    PostgresDatabaseModule,
    LoggerModule,
    HttpModule,
    CacheRedisModule,
    CacheMemoryModule,
    EmailModule,
    CacheAsideModule
  ]
})
export class InfraModule {}
