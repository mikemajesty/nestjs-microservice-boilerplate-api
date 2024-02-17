import { Module } from '@nestjs/common';

import { ILoggerAdapter, LoggerModule } from '@/infra/logger';
import { ISecretsAdapter, SecretsModule } from '@/infra/secrets';

import { IDataBaseAdapter } from '../adapter';
import { SequelizeService } from './service';

@Module({
  imports: [SecretsModule, LoggerModule],
  providers: [
    {
      provide: IDataBaseAdapter,
      useFactory: async (secret: ISecretsAdapter, logger: ILoggerAdapter) => {
        const postgres = new SequelizeService(secret, logger);
        await postgres.connect();

        return postgres;
      },
      inject: [ISecretsAdapter, ILoggerAdapter]
    }
  ],
  exports: [IDataBaseAdapter]
})
export class PostgresDatabaseModule {}
