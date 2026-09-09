/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/infra/http.md
 */
import { AxiosRequestConfig } from 'axios'

import { HttpData } from './types'

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
  abstract timeout(ms: number): IHttpBuilder<Response>
  abstract retry(retries: number, status?: number[]): IHttpBuilder<Response>

  abstract execute(): Promise<Response>
}
