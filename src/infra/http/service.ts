import { Injectable } from '@nestjs/common';
import axios, { Axios } from 'axios';
import axiosRetry from 'axios-retry';

import { ILoggerAdapter } from '../logger';
import { IHttpAdapter } from './adapter';

@Injectable()
export class HttpService implements IHttpAdapter {
  constructor(private readonly loggerService: ILoggerAdapter) {}

  instance(): Axios {
    const client = axios.create();

    axiosRetry(client, {
      retries: 0,
      retryDelay: (retryCount, axiosError) => {
        this.loggerService.warn({
          message: `retry attempt: ${retryCount}`,
          obj: { warn: axiosError.message, status: axiosError.status || axiosError.code }
        });
        return retryCount * 2000;
      },
      retryCondition: (error) => {
        const status = error?.response?.status || 500;
        return [status === 503].some(Boolean);
      }
    });

    return client;
  }
}
