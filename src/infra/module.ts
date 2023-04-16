import { Module } from '@nestjs/common';

import { MemoryCacheModule } from './cache/memory';
import { RedisCacheModule } from './cache/redis';
import { MongoDatabaseModule } from './database/mongo';
import { PostgresDatabaseModule } from './database/postgres/module';
import { HttpModule } from './http';
import { LoggerModule } from './logger';
import { SecretsModule } from './secrets';

@Module({
  imports: [
    SecretsModule,
    MongoDatabaseModule,
    PostgresDatabaseModule,
    LoggerModule,
    HttpModule,
    RedisCacheModule,
    MemoryCacheModule
  ]
})
export class InfraModule {}
