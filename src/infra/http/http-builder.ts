import { AxiosInstance, AxiosRequestConfig } from 'axios';

import { CustomAxiosError } from '@/utils/axios';
import {
  ApiBadRequestException,
  ApiConflictException,
  ApiForbiddenException,
  ApiInternalServerException,
  ApiNotFoundException,
  ApiTimeoutException,
  ApiUnauthorizedException,
  ApiUnprocessableEntityException,
  BaseException
} from '@/utils/exception';

import { IHttpBuilder } from './adapter';
import { HttpData, HttpMethod, HttpResponse } from './types';

export class HttpBuilder implements IHttpBuilder {
  private requestConfig: {
    method: HttpMethod;
    url: string;
    data?: HttpData;
    headers: Record<string, string>;
    axiosConfig: AxiosRequestConfig;
    retries: number;
  };

  constructor(private readonly axiosInstance: AxiosInstance) {
    this.requestConfig = {
      method: 'GET',
      url: '',
      headers: {},
      axiosConfig: {},
      retries: 0
    };
  }

  method(method: HttpMethod): this {
    this.requestConfig.method = method;
    return this;
  }

  url(url: string): this {
    this.requestConfig.url = url;
    return this;
  }

  body<Request extends HttpData = HttpData>(data: Request): this {
    this.requestConfig.data = data;
    return this;
  }

  headers(headers: Record<string, string>): this {
    this.requestConfig.headers = { ...this.requestConfig.headers, ...headers };
    return this;
  }

  header(key: string, value: string): this {
    this.requestConfig.headers[`${key}`] = value;
    return this;
  }

  config(config: AxiosRequestConfig): this {
    this.requestConfig.axiosConfig = { ...this.requestConfig.axiosConfig, ...config };
    return this;
  }

  timeout(ms: number): this {
    this.requestConfig.axiosConfig.timeout = ms;
    return this;
  }

  retry(retries: number): this {
    this.requestConfig.retries = retries;
    return this;
  }

  async execute<Response = unknown>(): Promise<Response> {
    const startTime = Date.now();

    try {
      const response = await this.axiosInstance({
        method: this.requestConfig.method,
        url: this.requestConfig.url,
        data: this.requestConfig.data,
        headers: this.requestConfig.headers,
        ...this.requestConfig.axiosConfig
      });

      return response.data;
    } catch (error) {
      const duration = Date.now() - startTime;
      throw this.convertToApiException(error, duration);
    }
  }

  async safeExecute<Response = unknown>(): Promise<HttpResponse<Response>> {
    const startTime = Date.now();

    try {
      const response = await this.axiosInstance({
        method: this.requestConfig.method,
        url: this.requestConfig.url,
        data: this.requestConfig.data,
        headers: this.requestConfig.headers,
        ...this.requestConfig.axiosConfig
      });

      return {
        data: response.data,
        error: null,
        headers: response.headers as Record<string, string>,
        status: response.status,
        success: true,
        duration: Date.now() - startTime
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const apiError = this.convertToApiException(error, duration);

      return {
        data: null,
        error: apiError,
        headers: ((error as CustomAxiosError)?.response?.headers || {}) as Record<string, string>,
        status: (error as CustomAxiosError)?.response?.status || 500,
        success: false,
        duration
      };
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private convertToApiException(error: any, duration: number): BaseException {
    const status = (error as CustomAxiosError)?.response?.status || 500;
    const message = (error as CustomAxiosError)?.response?.data?.message || error.message;

    const parameters = {
      context: 'HttpBuilder',
      duration,
      url: this.requestConfig.url,
      method: this.requestConfig.method,
      originalError: error
    };

    switch (status) {
      case 400:
        return new ApiBadRequestException(message, parameters);
      case 401:
        return new ApiUnauthorizedException(message, parameters);
      case 403:
        return new ApiForbiddenException(message, parameters);
      case 404:
        return new ApiNotFoundException(message, parameters);
      case 408:
        return new ApiTimeoutException(message, parameters);
      case 409:
        return new ApiConflictException(message, parameters);
      case 422:
        return new ApiUnprocessableEntityException(message, parameters);
      default:
        return new ApiInternalServerException(message, parameters);
    }
  }
}
