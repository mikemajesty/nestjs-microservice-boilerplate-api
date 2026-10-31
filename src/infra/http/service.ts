/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/infra/http.md
 */
import axios, { AxiosInstance, CreateAxiosDefaults, InternalAxiosRequestConfig } from 'axios'
import axiosBetterStacktrace from 'axios-better-stacktrace'
import https from 'https'

import { AxiosUtils } from '@/utils/axios'
import { ByteSize } from '@/utils/byte-size'
import { ObjectUtils } from '@/utils/object'
import { TimeoutBudget } from '@/utils/request/timeout-budget'

import { ILoggerAdapter } from '../logger'
import { IHttpAdapter, IHttpBuilder } from './adapter'
import { HttpBuilder } from './http-builder'

export class HttpService implements IHttpAdapter {
  static readonly DEFAULT_MAX_RESPONSE_SIZE_BYTES = ByteSize.fromMegabytes(10)

  static readonly DEFAULT_MAX_REQUEST_SIZE_BYTES = ByteSize.fromMegabytes(10)

  private axios: AxiosInstance

  constructor(
    private readonly loggerService: ILoggerAdapter,
    options: CreateAxiosDefaults = {}
  ) {
    const httpsAgent = new https.Agent({
      keepAlive: true
    })

    const defaults: CreateAxiosDefaults = {
      proxy: false,
      httpsAgent,
      timeout: TimeoutBudget.DEPENDENCY_TIMEOUT_MS,
      maxContentLength: HttpService.DEFAULT_MAX_RESPONSE_SIZE_BYTES,
      maxBodyLength: HttpService.DEFAULT_MAX_REQUEST_SIZE_BYTES
    }

    const mergedOptions = ObjectUtils.mergeShallow(defaults, options)

    this.axios = axios.create(mergedOptions)

    AxiosUtils.requestRetry({ axios: this.axios, logger: this.loggerService })
    axiosBetterStacktrace(this.axios)

    this.axios.interceptors.request.use((config) => this.warnUnlimitedPayloadSize(config))

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

  private warnUnlimitedPayloadSize(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
    // Retries reuse the config; warn once per operation.
    if (config['axios-retry']?.retryCount) return config

    const unlimited = [config.maxContentLength === -1 && 'response', config.maxBodyLength === -1 && 'request'].filter(
      Boolean
    )

    if (unlimited.length) {
      this.loggerService.warn({
        message: 'HTTP request without payload size limit',
        metadata: { unlimited, url: config.url, method: config.method?.toUpperCase() }
      })
    }

    return config
  }
}
