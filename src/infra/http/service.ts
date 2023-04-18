import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import * as https from 'https';

import { ILoggerAdapter } from '../logger';
import { IHttpAdapter } from './adapter';

@Injectable()
export class HttpService implements IHttpAdapter {
  private axios: AxiosInstance;

  constructor(private readonly loggerService: ILoggerAdapter) {
    const httpsAgent = new https.Agent({
      keepAlive: true,
      maxFreeSockets: 2000,
      rejectUnauthorized: false
    });

    this.axios = axios.create({ proxy: false, httpsAgent });

    axiosRetry(this.axios, {
      shouldResetTimeout: true,
      retryDelay: (retryCount, axiosError) => {
        this.loggerService.warn({
          message: `retry attempt: ${retryCount}`,
          obj: {
            statusText: [axiosError.response?.data['message'], axiosError.message].find(Boolean),
            status: [
              axiosError.response?.status,
              axiosError.status,
              axiosError.response?.data['status'],
              axiosError.code
            ].find(Boolean),
            url: axiosError.config.url,
            input: axiosError?.config?.data
          }
        });
        return retryCount * 2000;
      },
      retryCondition: (error) => {
        const status = [error?.response?.status, error.code, error.status].find(Boolean) || 500;
        return [status === 'EAI_AGAIN', status === 503, status === 500, status === 422].some(Boolean);
      }
    });
  }

  instance(): AxiosInstance {
    return this.axios;
  }
}
