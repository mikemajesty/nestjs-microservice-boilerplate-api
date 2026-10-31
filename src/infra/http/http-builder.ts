import { HttpStatus } from '@nestjs/common'
import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

import { AxiosUtils } from '@/utils/axios'
import {
  ApiBadGatewayException,
  ApiInternalServerException,
  ApiServiceUnavailableException,
  ApiTimeoutException,
  BaseException,
  exceptionFromStatus
} from '@/utils/exception'
import { CLIENT_TIMEOUT_CODES, CONNECTION_REFUSED_CODE } from '@/utils/http-status'
import { ObjectUtils } from '@/utils/object'
import { TRACEID_HEADER } from '@/utils/request'
import { getCurrentRequestContext, type RequestContext } from '@/utils/request/context'
import { getCurrentDeadline, type RequestDeadline } from '@/utils/request/deadline'
import { TimeoutBudget } from '@/utils/request/timeout-budget'
import { BaseZodType, SchemaInfer } from '@/utils/validator'

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
    builder.requestConfig.responseSchema = undefined

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
    builder.requestConfig.responseSchema = undefined

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
    builder.requestConfig.responseSchema = undefined

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
    builder.requestConfig.responseSchema = undefined

    return builder
  }

  delete<NextResponse = Response>(url: string, config?: AxiosRequestConfig): HttpBuilder<NextResponse> {
    const builder = new HttpBuilder<NextResponse>(this.axiosInstance, this.requestConfig)
    builder.requestConfig.method = 'DELETE'
    builder.requestConfig.url = url
    builder.requestConfig.data = undefined
    builder.requestConfig.axiosConfig = { ...builder.requestConfig.axiosConfig, ...config }
    builder.requestConfig.responseSchema = undefined

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

  maxResponseSize(bytes: number): this {
    this.requestConfig.axiosConfig.maxContentLength = toAxiosSizeLimit(bytes, 'maxResponseSize')
    return this
  }

  maxRequestSize(bytes: number): this {
    this.requestConfig.axiosConfig.maxBodyLength = toAxiosSizeLimit(bytes, 'maxRequestSize')
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

  schema<Schema extends BaseZodType>(schema: Schema): HttpBuilder<SchemaInfer<Schema>> {
    const builder = new HttpBuilder<SchemaInfer<Schema>>(this.axiosInstance, this.requestConfig)
    builder.requestConfig.responseSchema = schema

    return builder
  }

  async execute(): Promise<Response> {
    const startTime = Date.now()
    const requestContext = getCurrentRequestContext()

    const headers = {
      ...this.getPropagationHeaders(requestContext),
      ...this.requestConfig.headers
    }

    const deadline = getCurrentDeadline()

    if (deadline?.hasExpired()) {
      throw new ApiTimeoutException('Request deadline exceeded before calling the dependency', {
        context: this.constructor.name,
        duration: Date.now() - startTime,
        url: this.requestConfig.url,
        method: this.requestConfig.method
      })
    }

    let response: AxiosResponse

    try {
      response = await this.axiosInstance({
        ...this.requestConfig.axiosConfig,
        timeout: this.resolveTimeoutMs(deadline),
        method: this.requestConfig.method,
        url: this.requestConfig.url,
        data: this.requestConfig.data,
        headers
      })
    } catch (error) {
      const duration = Date.now() - startTime
      throw this.convertToApiException(error as CustomAxiosError, duration)
    }

    // Outside the axios call so a contract mismatch is never retried.
    return this.parseResponse(response.data, response.status, startTime)
  }

  // Not a raw ZodError: the exception filter would turn it into a 400 and return the issues
  // to the client. `upstreamIssues` is logged but, unlike `details`, never sent back.
  private async parseResponse(data: unknown, status: number, startTime: number): Promise<Response> {
    const { responseSchema } = this.requestConfig

    if (!responseSchema) return data as Response

    const result = await responseSchema.safeParseAsync(data)

    if (result.success) return result.data as Response

    throw new ApiBadGatewayException('Dependency response does not match the expected schema', {
      context: this.constructor.name,
      duration: Date.now() - startTime,
      url: this.requestConfig.url,
      method: this.requestConfig.method,
      status,
      upstreamIssues: result.error.issues
    })
  }

  private resolveTimeoutMs(deadline: RequestDeadline | undefined): number {
    const configuredTimeout =
      this.requestConfig.axiosConfig.timeout ||
      this.axiosInstance.defaults.timeout ||
      TimeoutBudget.DEPENDENCY_TIMEOUT_MS

    return deadline ? deadline.getTimeoutMs(configuredTimeout) : configuredTimeout
  }

  private getStatusWithoutResponse(error: CustomAxiosError): number {
    if (CLIENT_TIMEOUT_CODES.includes(error.code as string)) return ApiTimeoutException.STATUS
    if (error.code === CONNECTION_REFUSED_CODE) return ApiServiceUnavailableException.STATUS
    if (AxiosUtils.getPayloadLimitExceeded(error) === 'response') return ApiBadGatewayException.STATUS

    return ApiInternalServerException.STATUS
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
    const upstreamStatus = ObjectUtils.reach(error, (e) => e.response.status, this.getStatusWithoutResponse(error))
    const message = ObjectUtils.reach(error, (e) => e.response.data.message, error.message)

    return exceptionFromStatus({
      status: UPSTREAM_STATUS_TRANSLATION[upstreamStatus] ?? upstreamStatus,
      message,
      metadata: {
        context: this.constructor.name,
        duration,
        url: this.requestConfig.url,
        method: this.requestConfig.method,
        upstreamStatus,
        cause: error
      }
    })
  }
}

// Upstream statuses that would mislead our own client if forwarded as is.
// A dependency rate-limiting us means we are unavailable, not that our client is being limited.
const UPSTREAM_STATUS_TRANSLATION: Record<number, number> = {
  [HttpStatus.TOO_MANY_REQUESTS]: ApiServiceUnavailableException.STATUS
}

// Axios represents "no limit" as -1.
const toAxiosSizeLimit = (bytes: number, method: string): number => {
  if (bytes === Infinity || bytes === -1) return -1

  if (!Number.isSafeInteger(bytes) || bytes <= 0) {
    throw new ApiInternalServerException(
      `${method}: expected a positive integer number of bytes, Infinity or -1, received ${bytes}`
    )
  }

  return bytes
}

type CustomAxiosError = {
  message: string
  code?: string
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
  responseSchema?: BaseZodType
}

declare module 'axios-retry' {
  interface IAxiosRetryConfig {
    status?: number[]
    retryBudgetMs?: number
  }
}
