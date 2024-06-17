import { Module } from '@nestjs/common';

import { MemoryCacheModule } from './cache/memory';
import { PostgresDatabaseModule } from './database/postgres/module';
import { EmailModule } from './email';
import { HttpModule } from './http';
import { LoggerModule } from './logger';
import { SecretsModule } from './secrets';

@Module({
  imports: [SecretsModule, PostgresDatabaseModule, LoggerModule, HttpModule, MemoryCacheModule, EmailModule]
})
export class InfraModule {}
