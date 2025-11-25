import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import axiosBetterStacktrace from 'axios-better-stacktrace';
import https from 'https';

import { AxiosUtils } from '@/utils/axios';
import { TracingType } from '@/utils/request';

import { ILoggerAdapter } from '../logger';
import { IHttpAdapter, IHttpBuilder } from './adapter';
import { HttpBuilder } from './http-builder'; // Importa a implementação concreta
import { HttpData } from './types';

export class HttpService implements IHttpAdapter<AxiosInstance> {
  public tracing!: Exclude<TracingType, 'axios'>;
  private axios: AxiosInstance;

  constructor(private readonly loggerService: ILoggerAdapter) {
    const httpsAgent = new https.Agent({
      keepAlive: true
    });

    this.axios = axios.create({
      proxy: false,
      httpsAgent,
      timeout: 30000
    });

    AxiosUtils.requestRetry({ axios: this.axios, logger: this.loggerService });
    axiosBetterStacktrace(this.axios);

    this.axios.interceptors.response.use(
      (response) => response,
      (error) => {
        AxiosUtils.interceptAxiosResponseError(error);
        return Promise.reject(error);
      }
    );
  }

  instance(): AxiosInstance {
    return this.axios;
  }

  async get<Response = unknown>(url: string, config?: AxiosRequestConfig): Promise<Response> {
    const response = await this.axios.get<Response>(url, config);
    return response.data;
  }

  async post<Response = unknown, Request = HttpData>(
    url: string,
    data?: Request,
    config?: AxiosRequestConfig
  ): Promise<Response> {
    const response = await this.axios.post<Response>(url, data, config);
    return response.data;
  }

  async put<Response = unknown, Request = HttpData>(
    url: string,
    data?: Request,
    config?: AxiosRequestConfig
  ): Promise<Response> {
    const response = await this.axios.put<Response>(url, data, config);
    return response.data;
  }

  async patch<Response = unknown, Request = HttpData>(
    url: string,
    data?: Request,
    config?: AxiosRequestConfig
  ): Promise<Response> {
    const response = await this.axios.patch<Response>(url, data, config);
    return response.data;
  }

  async delete<Response = unknown>(url: string, config?: AxiosRequestConfig): Promise<Response> {
    const response = await this.axios.delete<Response>(url, config);
    return response.data;
  }

  request(): IHttpBuilder {
    // ✅ Cria o HttpBuilder com a instância do axios
    return new HttpBuilder(this.axios);
  }
}
