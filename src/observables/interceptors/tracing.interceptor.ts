import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import axiosBetterStacktrace from 'axios-better-stacktrace';
import { Observable } from 'rxjs';

import { ILoggerAdapter } from '@/infra/logger';
import { interceptAxiosResponseError, requestRetry } from '@/utils/axios';
import { TracingType } from '@/utils/request';

@Injectable()
export class TracingInterceptor implements NestInterceptor {
  constructor(private readonly logger: ILoggerAdapter) {}

  intercept(executionContext: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = executionContext.switchToHttp().getRequest();

    const requestId = request.headers.traceid ?? request.id;

    const createTracingInstance = (): TracingType => {
      return {
        axios: (options: Omit<AxiosRequestConfig, 'headers'>): AxiosInstance => {
          request.headers.traceid = requestId;

          const http = axios.create({
            ...options,
            headers: { traceid: request.id, authorization: request.headers.authorization }
          });

          axiosBetterStacktrace(http);

          requestRetry({ axios: http, logger: this.logger });

          http.interceptors.response.use(
            (response) => response,
            (error) => {
              interceptAxiosResponseError(error);
              return Promise.reject(error);
            }
          );

          return http;
        }
      };
    };

    request.tracing = createTracingInstance();

    return next.handle();
  }
}
