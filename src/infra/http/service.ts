import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import axiosBetterStacktrace from 'axios-better-stacktrace';
import https from 'https';

import { interceptAxiosResponseError, requestRetry } from '@/utils/axios';
import { TracingType } from '@/utils/request';

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
    requestRetry({ axios: this.axios, logger: this.loggerService });

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
