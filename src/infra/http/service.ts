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
          obj: {
            response: axiosError.response.data['message'],
            status: [axiosError.response.status, axiosError.status, axiosError.code].find(Boolean)
          }
        });
        return retryCount * 1500;
      },
      retryCondition: (error) => {
        const status = error?.response?.status || 500;
        return [status === 503, status === 408].some(Boolean);
      }
    });

    return client;
  }
}
