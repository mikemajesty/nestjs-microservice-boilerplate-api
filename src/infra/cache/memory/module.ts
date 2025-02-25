import { Module } from '@nestjs/common';

import { ILoggerAdapter, LoggerModule } from '@/infra/logger';

import { ICacheAdapter } from '../adapter';
import { MemoryCacheService } from './service';

@Module({
  imports: [LoggerModule],
  providers: [
    {
      provide: ICacheAdapter,
      useFactory: async (logger: ILoggerAdapter) => {
        const cacheService = new MemoryCacheService(logger);
        cacheService.connect();
        return cacheService;
      },
      inject: [ILoggerAdapter]
    }
  ],
  exports: [ICacheAdapter]
})
export class MemoryCacheModule {}
