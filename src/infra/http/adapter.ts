/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/infra/http.md
 */
import { AxiosRequestConfig } from 'axios'

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
   * Set the number of retries and optionally the status codes that should trigger a retry. @DEFAULT_RETRY_STATUS
   */
  abstract retry(input: HttpRetryInput): IHttpBuilder<Response>

  abstract execute(): Promise<Response>
}
