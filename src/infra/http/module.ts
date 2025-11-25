import { Module } from '@nestjs/common';
import axios from 'axios';

import { ILoggerAdapter, LoggerModule } from '@/infra/logger';

import { IHttpAdapter } from './adapter';
import { HttpBuilder } from './http-builder';
import { HttpService } from './service';

@Module({
  imports: [LoggerModule],
  providers: [
    {
      provide: IHttpAdapter,
      useFactory: (logger: ILoggerAdapter) => {
        const httpBuilder = new HttpBuilder(axios);
        return new HttpService(logger, httpBuilder);
      },
      inject: [ILoggerAdapter]
    }
  ],
  exports: [IHttpAdapter]
})
export class HttpModule {}
