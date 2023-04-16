import { Module } from '@nestjs/common';

import { ILoggerAdapter, LoggerModule } from '@/infra/logger';

import { IDataBaseAdapter } from '../adapter';
import { sequelizeConfig } from './config';
import { SequelizeService } from './service';

@Module({
  imports: [LoggerModule],
  providers: [
    {
      provide: IDataBaseAdapter,
      useFactory: async (logger: ILoggerAdapter) => {
        const postgres = new SequelizeService(sequelizeConfig, logger);
        await postgres.connect();

        return postgres;
      },
      inject: [ILoggerAdapter]
    }
  ],
  exports: [IDataBaseAdapter]
})
export class PostgresDatabaseModule {}
