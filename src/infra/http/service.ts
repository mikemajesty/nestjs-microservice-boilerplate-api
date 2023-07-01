import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import axiosBetterStacktrace from 'axios-better-stacktrace';
import axiosRetry from 'axios-retry';
import * as https from 'https';

import { TracingType } from '@/utils/request';
import { interceptAxiosResponseError } from '@/utils/response';

import { ILoggerAdapter } from '../logger';
import { IHttpAdapter } from './adapter';

@Injectable()
export class HttpService implements IHttpAdapter {
  public tracing: Exclude<TracingType, 'axios'>;

  private axios: AxiosInstance;

  constructor(private readonly loggerService: ILoggerAdapter) {
    const httpsAgent = new https.Agent({
      keepAlive: true,
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
              axiosError?.response?.data['code'],
              axiosError.code
            ].find(Boolean),
            url: axiosError.config.url
          }
        });
        return retryCount * 2000;
      },
      retryCondition: (error) => {
        const status = error?.response?.status || 500;
        return [status === 503, status === 422, status === 408].some(Boolean);
      }
    });

    axiosBetterStacktrace(this.axios);

    this.axios.interceptors.response.use(
      (response) => response,
      (error) => {
        interceptAxiosResponseError(error, this.loggerService);
        return Promise.reject(error);
      }
    );
  }

  instance(): AxiosInstance {
    return this.axios;
  }
}
