import { Module } from '@nestjs/common';

import { ILoggerAdapter, LoggerModule } from '@/infra/logger';

import { IHttpAdapter } from './adapter';
import { HttpService } from './service';

@Module({
  imports: [LoggerModule],
  providers: [
    {
      provide: IHttpAdapter,
      useFactory: (logger: ILoggerAdapter) => {
        return new HttpService(logger);
      },
      inject: [ILoggerAdapter]
    }
  ],
  exports: [IHttpAdapter]
})
export class HttpModule {}
