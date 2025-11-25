import { Axios, AxiosInstance, AxiosRequestConfig } from 'axios';

import { TracingType } from '@/utils/request';

import { HttpData, HttpMethod, HttpResponse } from './types';

export abstract class IHttpAdapter<T = Axios | AxiosInstance> {
  abstract instance(): T;
  abstract tracing?: TracingType;

  // Métodos tradicionais (lançam erro)
  abstract get<Response = unknown>(url: string, config?: AxiosRequestConfig): Promise<Response>;
  abstract post<Response = unknown, Request = HttpData>(
    url: string,
    data?: Request,
    config?: AxiosRequestConfig
  ): Promise<Response>;
  abstract put<Response = unknown, Request = HttpData>(
    url: string,
    data?: Request,
    config?: AxiosRequestConfig
  ): Promise<Response>;
  abstract patch<Response = unknown, Request = HttpData>(
    url: string,
    data?: Request,
    config?: AxiosRequestConfig
  ): Promise<Response>;
  abstract delete<Response = unknown>(url: string, config?: AxiosRequestConfig): Promise<Response>;

  abstract request(): IHttpBuilder;
}

export abstract class IHttpBuilder {
  abstract method(method: HttpMethod): IHttpBuilder;
  abstract url(url: string): IHttpBuilder;
  abstract body<Request extends HttpData = HttpData>(data: Request): IHttpBuilder;
  abstract headers(headers: Record<string, string>): IHttpBuilder;
  abstract header(key: string, value: string): IHttpBuilder;
  abstract config(config: AxiosRequestConfig): IHttpBuilder;
  abstract timeout(ms: number): IHttpBuilder;
  abstract retry(retries: number): IHttpBuilder;

  abstract execute<Response = unknown>(): Promise<Response>;
  abstract safeExecute<Response = unknown>(): Promise<HttpResponse<Response>>;
}

export abstract class IHttpBuilderFactory {
  abstract create(axiosInstance: AxiosInstance): IHttpBuilder;
}
