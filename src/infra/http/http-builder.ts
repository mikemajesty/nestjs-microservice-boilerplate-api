import { AxiosInstance, AxiosRequestConfig } from 'axios'

import { BaseException, exceptionFromStatus } from '@/utils/exception'
import { ObjectUtils } from '@/utils/object'
import { TRACEID_HEADER } from '@/utils/request'
import { getCurrentRequestContext, type RequestContext } from '@/utils/request/context'
import { getCurrentDeadline } from '@/utils/request/deadline'
import { TimeoutBudget } from '@/utils/request/timeout-budget'

import { IHttpBuilder } from './adapter'
import { HttpData, HttpMethod, HttpRetryInput } from './types'

export class HttpBuilder<Response = unknown> implements IHttpBuilder<Response> {
  private requestConfig: HttpBuilderRequestConfig

  constructor(
    private readonly axiosInstance: AxiosInstance,
    requestConfig?: HttpBuilderRequestConfig
  ) {
    if (requestConfig) {
      this.requestConfig = {
        ...requestConfig,
        headers: { ...requestConfig.headers },
        axiosConfig: { ...requestConfig.axiosConfig }
      }
      return
    }

    this.requestConfig = {
      method: 'GET',
      url: '',
      headers: {},
      axiosConfig: {},
      propagateAuth: false
    }
  }

  get<NextResponse = Response>(url: string, config?: AxiosRequestConfig): HttpBuilder<NextResponse> {
    const builder = new HttpBuilder<NextResponse>(this.axiosInstance, this.requestConfig)
    builder.requestConfig.method = 'GET'
    builder.requestConfig.url = url
    builder.requestConfig.data = undefined
    builder.requestConfig.axiosConfig = { ...builder.requestConfig.axiosConfig, ...config }

    return builder
  }

  post<NextResponse = Response, Request extends HttpData = HttpData>(
    url: string,
    data?: Request,
    config?: AxiosRequestConfig
  ): HttpBuilder<NextResponse> {
    const builder = new HttpBuilder<NextResponse>(this.axiosInstance, this.requestConfig)
    builder.requestConfig.method = 'POST'
    builder.requestConfig.url = url
    builder.requestConfig.data = data
    builder.requestConfig.axiosConfig = { ...builder.requestConfig.axiosConfig, ...config }

    return builder
  }

  put<NextResponse = Response, Request extends HttpData = HttpData>(
    url: string,
    data?: Request,
    config?: AxiosRequestConfig
  ): HttpBuilder<NextResponse> {
    const builder = new HttpBuilder<NextResponse>(this.axiosInstance, this.requestConfig)
    builder.requestConfig.method = 'PUT'
    builder.requestConfig.url = url
    builder.requestConfig.data = data
    builder.requestConfig.axiosConfig = { ...builder.requestConfig.axiosConfig, ...config }

    return builder
  }

  patch<NextResponse = Response, Request extends HttpData = HttpData>(
    url: string,
    data?: Request,
    config?: AxiosRequestConfig
  ): HttpBuilder<NextResponse> {
    const builder = new HttpBuilder<NextResponse>(this.axiosInstance, this.requestConfig)
    builder.requestConfig.method = 'PATCH'
    builder.requestConfig.url = url
    builder.requestConfig.data = data
    builder.requestConfig.axiosConfig = { ...builder.requestConfig.axiosConfig, ...config }

    return builder
  }

  delete<NextResponse = Response>(url: string, config?: AxiosRequestConfig): HttpBuilder<NextResponse> {
    const builder = new HttpBuilder<NextResponse>(this.axiosInstance, this.requestConfig)
    builder.requestConfig.method = 'DELETE'
    builder.requestConfig.url = url
    builder.requestConfig.data = undefined
    builder.requestConfig.axiosConfig = { ...builder.requestConfig.axiosConfig, ...config }

    return builder
  }

  headers(headers: Record<string, string>): this {
    this.requestConfig.headers = { ...this.requestConfig.headers, ...headers }
    return this
  }

  header(key: string, value: string): this {
    this.requestConfig.headers[`${key}`] = value
    return this
  }

  timeout(ms: number): this {
    this.requestConfig.axiosConfig.timeout = ms
    return this
  }

  retry({ retries, retryStatusCodes, retryBudgetMs }: HttpRetryInput): this {
    const retryConfig = {
      ...this.requestConfig.axiosConfig['axios-retry'],
      retries
    }

    if (retryStatusCodes) retryConfig.status = retryStatusCodes
    if (retryBudgetMs !== undefined) retryConfig.retryBudgetMs = retryBudgetMs

    this.requestConfig.axiosConfig['axios-retry'] = retryConfig
    return this
  }

  propagateAuthorization(): this {
    this.requestConfig.propagateAuth = true
    return this
  }

  async execute(): Promise<Response> {
    const startTime = Date.now()
    const requestContext = getCurrentRequestContext()

    const headers = {
      ...this.getPropagationHeaders(requestContext),
      ...this.requestConfig.headers
    }

    try {
      const response = await this.axiosInstance({
        timeout: TimeoutBudget.getDependencyTimeoutMs(getCurrentDeadline()),
        ...this.requestConfig.axiosConfig,
        method: this.requestConfig.method,
        url: this.requestConfig.url,
        data: this.requestConfig.data,
        headers
      })

      return response.data as Response
    } catch (error) {
      const duration = Date.now() - startTime
      throw this.convertToApiException(error as CustomAxiosError, duration)
    }
  }

  private getPropagationHeaders(context: RequestContext | undefined): Record<string, string> {
    const headers: Record<string, string> = {}

    if (context?.[TRACEID_HEADER]) {
      headers[TRACEID_HEADER] = context[TRACEID_HEADER]
    }

    if (this.requestConfig.propagateAuth && context?.authorization) {
      headers.authorization = context.authorization
    }

    return headers
  }

  private convertToApiException(error: CustomAxiosError, duration: number): BaseException {
    const status = ObjectUtils.reach(error, (e) => e.response.status, 500)
    const message = ObjectUtils.reach(error, (e) => e.response.data.message, error.message)

    return exceptionFromStatus({
      status,
      message,
      metadata: {
        context: this.constructor.name,
        duration,
        url: this.requestConfig.url,
        method: this.requestConfig.method,
        cause: error
      }
    })
  }
}

type CustomAxiosError = {
  message: string
  response?: {
    status?: number
    data?: {
      message?: string
    }
  }
}

type HttpBuilderRequestConfig = {
  method: HttpMethod
  url: string
  data?: HttpData
  headers: Record<string, string>
  axiosConfig: AxiosRequestConfig
  propagateAuth?: boolean
}

declare module 'axios-retry' {
  interface IAxiosRetryConfig {
    status?: number[]
    retryBudgetMs?: number
  }
}
