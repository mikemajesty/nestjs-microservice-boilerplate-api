# HTTP Service

HTTP client abstraction built on Axios with retry, better stack traces, error normalization, cURL generation, and a fluent request builder.

Application code should depend on `IHttpAdapter`, not on Axios directly.

## Public API

```typescript
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
```

## Basic usage

```typescript
@Injectable()
export class PaymentService {
  constructor(private readonly http: IHttpAdapter) {}

  async getUser(id: string): Promise<User> {
    return this.http.request().get<User>(`https://api.example.com/users/${id}`).execute()
  }

  async createOrder(data: CreateOrderDTO): Promise<Order> {
    return this.http.request().post<Order>('https://api.example.com/orders', data).execute()
  }
}
```

## Headers and timeout

```typescript
const order = await this.http
  .request()
  .post<Order>('https://api.example.com/orders', data)
  .header('X-Api-Key', apiKey)
  .header('X-Request-Id', traceId)
  .timeout(5000)
  .execute()
```

## Axios config

Each HTTP verb accepts an optional `AxiosRequestConfig` for advanced options:

```typescript
const users = await this.http
  .request()
  .get<User[]>('https://api.example.com/users', {
    params: { page: 1, limit: 20 }
  })
  .execute()
```

## Retry per request

The Axios instance has a default retry policy, but each request can override retry attempts and retryable statuses:

```typescript
const result = await this.http
  .request()
  .post<Result>('https://api.example.com/process', payload)
  .retry(3, [408, 429, 503])
  .execute()
```

## Error conversion

`execute()` throws project exceptions instead of leaking raw Axios errors:

| HTTP status | Exception |
| --- | --- |
| 400 | `ApiBadRequestException` |
| 401 | `ApiUnauthorizedException` |
| 403 | `ApiForbiddenException` |
| 404 | `ApiNotFoundException` |
| 408 | `ApiTimeoutException` |
| 409 | `ApiConflictException` |
| 422 | `ApiUnprocessableEntityException` |
| Other | `ApiInternalServerException` |

The original Axios error is preserved as `cause` in the exception metadata.

## Google OAuth example

```typescript
type GoogleTokenResponse = {
  access_token: string
}

type GoogleProfile = {
  name: string
  email: string
}

const tokenResponse = await this.http
  .request()
  .post<GoogleTokenResponse>('https://oauth2.googleapis.com/token', {
    client_id,
    client_secret,
    code,
    redirect_uri,
    grant_type: 'authorization_code'
  })
  .execute()

const profile = await this.http
  .request()
  .get<GoogleProfile>('https://www.googleapis.com/oauth2/v1/userinfo', {
    headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
  })
  .execute()
```

## Related

- [AxiosUtils](../utils/axios.md)
- [TracingInterceptor](../middlewares/tracing.interceptor.md)
