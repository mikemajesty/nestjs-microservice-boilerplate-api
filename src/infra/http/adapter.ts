/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/infra/http.md
 */
import { AxiosRequestConfig } from 'axios'

import { BaseZodType, SchemaInfer } from '@/utils/validator'

import { HttpData, HttpRetryInput } from './types'

export abstract class IHttpAdapter {
  abstract request(): IHttpBuilder<unknown>
}

export abstract class IHttpBuilder<Response = unknown> {
  abstract get<NextResponse = Response>(url: string, config?: AxiosRequestConfig): IHttpBuilder<NextResponse>
  abstract post<NextResponse = Response, Request extends HttpData = HttpData>(
    url: string,
    data?: Request,
    config?: AxiosRequestConfig
  ): IHttpBuilder<NextResponse>
  abstract put<NextResponse = Response, Request extends HttpData = HttpData>(
    url: string,
    data?: Request,
    config?: AxiosRequestConfig
  ): IHttpBuilder<NextResponse>
  abstract patch<NextResponse = Response, Request extends HttpData = HttpData>(
    url: string,
    data?: Request,
    config?: AxiosRequestConfig
  ): IHttpBuilder<NextResponse>
  abstract delete<NextResponse = Response>(url: string, config?: AxiosRequestConfig): IHttpBuilder<NextResponse>

  abstract headers(headers: Record<string, string>): IHttpBuilder<Response>
  abstract header(key: string, value: string): IHttpBuilder<Response>
  /**
   * Set the network timeout for the HTTP request in milliseconds.
   */
  abstract timeout(ms: number): IHttpBuilder<Response>
  /**
   * Decompressed size in bytes. Exceeding it throws a 502, never retried.
   * `Infinity`/`-1` disables the limit and logs a warning.
   */
  abstract maxResponseSize(bytes: number): IHttpBuilder<Response>
  /**
   * Exceeding it throws a 500 before sending, never retried.
   * `Infinity`/`-1` disables the limit and logs a warning.
   */
  abstract maxRequestSize(bytes: number): IHttpBuilder<Response>
  /**
   * Set the number of retries and optionally the status codes that should trigger a retry. @DEFAULT_RETRY_STATUS
   */
  abstract retry(input: HttpRetryInput): IHttpBuilder<Response>
  /**
   * Forwards the `authorization` header of the current inbound request to this outbound call.
   * Opt-in only: unlike the trace id, the caller's token is never forwarded automatically,
   * since most outbound calls (e.g. third-party integrations) must not receive it.
   */
  abstract propagateAuthorization(): IHttpBuilder<Response>
  /**
   * Must be called after the verb, which resets it. Returns the parsed value.
   * A mismatch throws a 502, never retried, with the issues in `parameters.upstreamIssues`.
   */
  abstract schema<Schema extends BaseZodType>(schema: Schema): IHttpBuilder<SchemaInfer<Schema>>

  abstract execute(): Promise<Response>
}
