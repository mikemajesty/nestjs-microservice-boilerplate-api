# Axios

Utilities for configuring Axios with retry behavior, cleaner errors, and debugging metadata.

The application should normally consume HTTP through `IHttpAdapter` and `IHttpBuilder`. This utility is the low-level Axios integration used by the HTTP service.

## Responsibilities

`AxiosUtils` centralizes:

- retry configuration with `axios-retry`
- retry logs with status, URL and method
- retry status extraction from different error shapes
- Axios error normalization
- cURL generation with sensitive fields masked

## Error normalization

`interceptAxiosResponseError` mutates the original Axios error and enriches it with:

- `message`
- `status`
- `curl`

```typescript
this.axios.interceptors.response.use(
  (response) => response,
  (error) => {
    AxiosUtils.interceptAxiosResponseError(error)
    return Promise.reject(error)
  }
)
```

## Status extraction

The status is resolved from the first valid HTTP status candidate, in this order:

```typescript
const statusCandidates = [
  error.response?.status,       // HTTP protocol truth, always wins when present
  error.status,
  error.response?.data?.code,       // fallback: business code in the body
  error.response?.data?.error?.code, // fallback: business code in the body
  500
]
```

`response.status` (the real HTTP status returned by the server) always takes
precedence over any `code` field the remote API may put in the response body.
Those body-level `code`/`error.code` fields are only used as a fallback when
there's no HTTP status at all (e.g. the request failed before a response
arrived). This avoids misreading a business error code (which many APIs don't
even use as an HTTP status, e.g. internal codes like `1042` or `E_VALIDATION`)
as if it were the HTTP status.

Only integer values between `100` and `599` are accepted. If no valid status is found, it falls back to `500`.

> Note: this heuristic assumes the external API reports errors via the HTTP
> status code and/or a `code`/`error.code` field in the body. Some APIs
> instead always respond with `200` and signal failure via a body flag (e.g.
> `{ success: false, errorCode: 'X' }`). That pattern isn't covered by this
> generic extraction — handle it explicitly in the caller.

## Message extraction

The message is resolved from the first truthy candidate:

```typescript
const messageCandidates = [
  error.response?.data?.description,
  error.response?.data?.error?.message,
  error.response?.data?.message,
  error.response?.statusText,
  error.message,
  'Internal Server Error'
]
```

## cURL generation

When an Axios request fails, the error receives a `curl` property that can be copied and executed to reproduce the request.

Sensitive fields are masked:

```typescript
['password', 'cpf', 'authorization', 'token']
```

Example:

```bash
curl -X POST 'https://api.example.com/orders' \
  -H 'Authorization: ******' \
  -d '{"amount":2500,"currency":"BRL"}'
```

## Retry behavior

Retry is **opt-in and explicit**: it's disabled by default (`retries: 0`) for
every request. Nothing is retried automatically just because `HttpService` was
instantiated — you must call `.retry(...)` on the request builder to enable it.

```typescript
AxiosUtils.requestRetry({
  axios: this.axios,
  logger: this.loggerService
})
```

This only installs the `axios-retry` plugin and its logging/backoff behavior
on the Axios instance; it does not retry anything on its own.

To enable retry for a specific request:

```typescript
const result = await this.http
  .request()
  .post<Result>('https://api.example.com/process', payload)
  .retry({ retries: 3, retryBudgetMs: 4000 })
  .execute()
```

Default retry statuses (used when `.retry()` doesn't pass `retryStatusCodes`):

```typescript
[408, 429, 500, 502, 503, 504]
```

Default retry network error codes:

```typescript
['ECONNABORTED', 'ECONNRESET', 'ETIMEDOUT']
```

## Idempotency is the caller's responsibility

Retrying `POST`/`PATCH` requests can duplicate side effects (e.g. creating the
same order twice or charging a card twice) if the original request reached the
server but the response was lost (e.g. `ECONNRESET`, `ETIMEDOUT`, or a `503`
after partial processing). Because retry is opt-in, **the caller decides**
whether enabling `.retry()` on a non-idempotent endpoint is safe — for example,
only do it when the endpoint is protected by an idempotency key.

The retry delay uses exponential backoff with full jitter. The delay is a
random value between zero and the maximum exponential backoff for that
attempt:

```typescript
const baseDelay = Math.pow(2, retryCount) * 1000
return Math.random() * baseDelay
```

With 3 retries, the maximum delay for each retry is:

- attempt 1: 0s to 2s
- attempt 2: 0s to 4s
- attempt 3: 0s to 8s

Full jitter avoids synchronizing clients that retry at the same exponential
backoff intervals, reducing contention when many requests fail together.

### Retry budget

Each request has a retry budget for scheduling retries, including elapsed time
and backoff delays. It defaults to `DEPENDENCY_TIMEOUT_MS`, but can be
overridden for a specific request:

```typescript
.retry({ retries: 3, retryBudgetMs: 4000 })
```

Before scheduling each retry, the client checks the elapsed operation time
plus the maximum possible next backoff. If that would reach or exceed the
remaining budget, the retry is skipped and the current error is propagated.
The actual scheduled delay still uses full jitter. This conservative check
avoids scheduling a retry that could exceed the budget. This is a static
per-call budget; it does not yet represent the remaining time of the inbound
request, and it does not abort an attempt that is already running. Dynamic
deadline propagation is planned for a later phase.

## Custom retry statuses per Axios instance

You can override the default retry status list when configuring the Axios instance:

```typescript
AxiosUtils.requestRetry({
  axios: this.axios,
  logger: this.loggerService,
  status: [408, 429, 503]
})
```

This changes which statuses are considered retryable; it still only applies
when a request explicitly calls `.retry()`.

## Custom retry per request

The fluent HTTP builder can override retry attempts and status codes for a single request:

```typescript
const result = await this.http
  .request()
  .post<Result>('https://api.example.com/process', payload)
  .retry({ retries: 3, retryStatusCodes: [408, 429, 503] })
  .execute()
```

Internally, the builder writes to the Axios request config:

```typescript
{
  'axios-retry': {
    retries: 3,
    status: [408, 429, 503]
  }
}
```

`AxiosUtils.requestRetry` then uses the request-specific status list when present. Otherwise, it falls back to the instance-level status list.

## Retry logs

During retry calculation:

```text
Retrying request: attempt 1
```

When a retry is scheduled:

```text
Retry scheduled: attempt 1
```

When all retries fail:

```text
All retry attempts failed after 3 retries
```

## Related

- [HTTP Service](../infra/http.md)
