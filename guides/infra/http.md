# HTTP Service

HTTP client abstraction built on Axios with retry, better stack traces, error normalization, cURL generation, and a fluent request builder.

Application code should depend on `IHttpAdapter`, not on Axios directly.

The Axios client uses `DEPENDENCY_TIMEOUT_MS` as its default timeout. This keeps
outbound HTTP calls below the global `HTTP_REQUEST_TIMEOUT_MS` budget. A request
can still override this default with `.timeout(ms)` or the Axios config passed
to an HTTP verb when a different limit is intentional.

Every request automatically carries the current inbound request's `traceid` and
respects its remaining [`Deadline`](../utils/deadline.md) for both the request
timeout and the retry budget — see [Automatic traceid and opt-in authorization
propagation](#automatic-traceid-and-opt-in-authorization-propagation) below.

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
  abstract retry(input: HttpRetryInput): IHttpBuilder<Response>
  abstract propagateAuthorization(): IHttpBuilder<Response>

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

## Automatic traceid and opt-in authorization propagation

Every request executed through `IHttpBuilder` automatically attaches the current
inbound request's `traceid` header — no explicit call needed. This is how distributed
tracing stays connected across services without repeating boilerplate on every
outbound call. See [`RequestContext`](../utils/request-context.md) for how the
current request's data is made available here.

Forwarding the caller's `authorization` header, however, is **opt-in**, via
`.propagateAuthorization()`:

```typescript
const user = await this.http
  .request()
  .get<User>(`https://internal-user-service/users/${id}`)
  .propagateAuthorization()
  .execute()
```

This is opt-in by design: most outbound calls (third-party integrations, public
APIs, webhooks) must **not** receive the caller's token — forwarding it
automatically everywhere would be a credential-leak risk. Only call
`.propagateAuthorization()` when the target is a trusted internal service meant
to act on behalf of the current user.

Headers set explicitly via `.header()`/`.headers()` always win over the
automatic `traceid` and the opt-in `authorization` — so you can still override
either one per call if needed.

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

Retry is **opt-in and disabled by default** — enabling it requires an explicit
`.retry()` call on the request:

```typescript
const result = await this.http
  .request()
  .post<Result>('https://api.example.com/process', payload)
  .retry({ retries: 3, retryStatusCodes: [408, 429, 503], retryBudgetMs: 4000 })
  .execute()
```

`retryBudgetMs` bounds the time available for scheduling retries, including
backoff delays. It defaults to `DEPENDENCY_TIMEOUT_MS`. Before each new retry,
the client checks the elapsed time plus the maximum possible next backoff; if
that would exhaust the budget, the current error is propagated instead of
scheduling another attempt. This conservative check avoids scheduling a retry
that could exceed the budget. This phase does not abort an attempt that is
already running.

See [Axios](../utils/axios.md) for retry defaults, backoff behavior, and
idempotency considerations for `POST`/`PATCH`.

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
| 503 | `ApiServiceUnavailableException` |
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
- [RequestContext](../utils/request-context.md)
- [Deadline](../utils/deadline.md)
