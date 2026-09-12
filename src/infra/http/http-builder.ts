import { AxiosInstance, AxiosRequestConfig } from 'axios'

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
} from '@/utils/exception'
import { ObjectUtils } from '@/utils/object'

import { IHttpBuilder } from './adapter'
import { HttpData, HttpMethod } from './types'

declare module 'axios-retry' {
  interface IAxiosRetryConfig {
    status?: number[]
  }
}

export class HttpBuilder<Response = unknown> implements IHttpBuilder<Response> {
  private requestConfig: HttpBuilderRequestConfig

  constructor(
    private readonly axiosInstance: AxiosInstance,
    requestConfig?: HttpBuilderRequestConfig
  ) {
    this.requestConfig = requestConfig
      ? {
          ...requestConfig,
          headers: { ...requestConfig.headers },
          axiosConfig: { ...requestConfig.axiosConfig }
        }
      : {
          method: 'GET',
          url: '',
          headers: {},
          axiosConfig: {}
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

  retry(retries: number, status?: number[]): this {
    this.requestConfig.axiosConfig['axios-retry'] = {
      ...this.requestConfig.axiosConfig['axios-retry'],
      retries,
      ...(status ? { status } : {})
    }
    return this
  }

  async execute(): Promise<Response> {
    const startTime = Date.now()

    try {
      const response = await this.axiosInstance({
        ...this.requestConfig.axiosConfig,
        method: this.requestConfig.method,
        url: this.requestConfig.url,
        data: this.requestConfig.data,
        headers: this.requestConfig.headers
      })

      return response.data as Response
    } catch (error) {
      const duration = Date.now() - startTime
      throw this.convertToApiException(error as CustomAxiosError, duration)
    }
  }

  private convertToApiException(error: CustomAxiosError, duration: number): BaseException {
    const status = ObjectUtils.reach(error, (e) => e.response.status, 500)
    const message = ObjectUtils.reach(error, (e) => e.response.data.message, error.message)

    const parameters = {
      context: 'HttpBuilder',
      duration,
      url: this.requestConfig.url,
      method: this.requestConfig.method,
      cause: error
    }

    switch (status) {
      case 400:
        return new ApiBadRequestException(message, parameters)
      case 401:
        return new ApiUnauthorizedException(message, parameters)
      case 403:
        return new ApiForbiddenException(message, parameters)
      case 404:
        return new ApiNotFoundException(message, parameters)
      case 408:
        return new ApiTimeoutException(message, parameters)
      case 409:
        return new ApiConflictException(message, parameters)
      case 422:
        return new ApiUnprocessableEntityException(message, parameters)
      default:
        return new ApiInternalServerException(message, parameters)
    }
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
}
