/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/infra/http.md
 */
import axios, { AxiosInstance } from 'axios'
import axiosBetterStacktrace from 'axios-better-stacktrace'
import https from 'https'

import { AxiosUtils } from '@/utils/axios'

import { ILoggerAdapter } from '../logger'
import { IHttpAdapter, IHttpBuilder } from './adapter'
import { HttpBuilder } from './http-builder'

export class HttpService implements IHttpAdapter {
  private axios: AxiosInstance

  constructor(private readonly loggerService: ILoggerAdapter) {
    const httpsAgent = new https.Agent({
      keepAlive: true
    })

    this.axios = axios.create({
      proxy: false,
      httpsAgent,
      timeout: 30000
    })

    AxiosUtils.requestRetry({ axios: this.axios, logger: this.loggerService })
    axiosBetterStacktrace(this.axios)

    this.axios.interceptors.response.use(
      (response) => response,
      (error) => {
        AxiosUtils.interceptAxiosResponseError(error)
        return Promise.reject(error)
      }
    )
  }

  request(): IHttpBuilder<unknown> {
    return new HttpBuilder(this.axios)
  }
}
