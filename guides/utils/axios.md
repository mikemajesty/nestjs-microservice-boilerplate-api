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

The status is resolved from the first valid HTTP status candidate:

```typescript
const statusCandidates = [
  error.response?.data?.code,
  error.response?.data?.error?.code,
  error.response?.status,
  error.status,
  500
]
```

Only integer values between `100` and `599` are accepted. If no valid status is found, it falls back to `500`.

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

Retry is installed once per Axios instance:

```typescript
AxiosUtils.requestRetry({
  axios: this.axios,
  logger: this.loggerService
})
```

Default retry statuses:

```typescript
[408, 429, 500, 502, 503, 504]
```

Default retry network error codes:

```typescript
['ECONNABORTED', 'ECONNRESET', 'ETIMEDOUT']
```

The retry delay uses exponential backoff plus jitter:

```typescript
const baseDelay = Math.pow(2, retryCount) * 1000
const jitter = Math.random() * 1000
return baseDelay + jitter
```

With the default 3 retries, retry delays are approximately:

- attempt 1: 2s to 3s
- attempt 2: 4s to 5s
- attempt 3: 8s to 9s

## Custom retry statuses per Axios instance

You can override the default retry status list when configuring the Axios instance:

```typescript
AxiosUtils.requestRetry({
  axios: this.axios,
  logger: this.loggerService,
  status: [408, 429, 503]
})
```

## Custom retry per request

The fluent HTTP builder can override retry attempts and status codes for a single request:

```typescript
const result = await this.http
  .request()
  .post<Result>('https://api.example.com/process', payload)
  .retry(3, [408, 429, 503])
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
