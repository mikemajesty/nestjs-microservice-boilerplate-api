# HTTP Service

HTTP client adapter built on **Axios** with automatic **retry**, **better stack traces**, **error sanitization**, and a **fluent builder pattern** for complex requests.

## Built-in Features

When you inject `IHttpAdapter`, you get an Axios instance pre-configured with:

```typescript
// Automatic retry with exponential backoff
AxiosUtils.requestRetry({ axios: this.axios, logger: this.loggerService })

// Better stack traces pointing to YOUR code, not axios internals
axiosBetterStacktrace(this.axios)

// Error sanitization + cURL generation
this.axios.interceptors.response.use(
  (response) => response,
  (error) => {
    AxiosUtils.interceptAxiosResponseError(error)  // Adds .curl, .status, .message
    return Promise.reject(error)
  }
)
```

| Feature | Benefit |
|---------|---------|
| **Retry Exponencial** | Auto-retries on 5xx, 503, 408, 429 with jitter |
| **Better Stack Trace** | Shows where YOU called axios, not internal noise |
| **Error Sanitization** | Extracts status/message from various response formats |
| **cURL Generation** | Every error includes ready-to-use curl command |

## Basic Methods

Simple HTTP methods that throw on error:

```typescript
@Injectable()
export class PaymentService {
  constructor(private readonly http: IHttpAdapter) {}
  
  async getUser(id: string): Promise<User> {
    return this.http.get<User>(`https://api.example.com/users/${id}`)
  }
  
  async createOrder(data: CreateOrderDTO): Promise<Order> {
    return this.http.post<Order>('https://api.example.com/orders', data)
  }
  
  async updateOrder(id: string, data: UpdateOrderDTO): Promise<Order> {
    return this.http.put<Order>(`https://api.example.com/orders/${id}`, data)
  }
  
  async deleteOrder(id: string): Promise<void> {
    return this.http.delete(`https://api.example.com/orders/${id}`)
  }
}
```

## Fluent Builder Pattern

For complex requests, use the **builder pattern** with `request()`:

```typescript
// Simple request
const user = await this.http.request()
  .method('GET')
  .url('https://api.example.com/users/123')
  .execute<User>()

// With headers and timeout
const order = await this.http.request()
  .method('POST')
  .url('https://api.example.com/orders')
  .body({ items: [...], total: 99.99 })
  .header('X-Api-Key', 'secret-key')
  .header('X-Request-Id', traceId)
  .timeout(5000)
  .execute<Order>()

// With custom config
const result = await this.http.request()
  .method('PUT')
  .url('https://api.example.com/heavy-operation')
  .body(largePayload)
  .config({ maxContentLength: Infinity })
  .timeout(60000)
  .execute()
```

## Safe Execute (No Throw)

Use `safeExecute()` when you want to handle errors without try/catch:

```typescript
const response = await this.http.request()
  .method('GET')
  .url('https://api.example.com/users/123')
  .safeExecute<User>()

if (response.success) {
  console.log(response.data)      // User
  console.log(response.status)    // 200
  console.log(response.duration)  // 150 (ms)
} else {
  console.log(response.error)     // ApiNotFoundException
  console.log(response.status)    // 404
}

// Response type
type HttpResponse<T> = {
  data: T | null
  error: BaseException | null
  headers: Record<string, string>
  status: number
  success: boolean
  duration: number
}
```

## Automatic Retry Example

The retry is automatic for transient failures:

```
Request to https://payment-service/charge
    │
    ├── Attempt 1: 503 Service Unavailable
    │   └── Log: "Retry attempt: 1" 
    │   └── Wait: ~2000-3000ms (exponential + jitter)
    │
    ├── Attempt 2: 503 Service Unavailable  
    │   └── Log: "Retry attempt: 2"
    │   └── Wait: ~4000-5000ms
    │
    ├── Attempt 3: 200 OK ✅
    │   └── Returns response
    │
    └── (If all fail after 3 retries, throws error)
```

**Retryable conditions:**
- Network errors: `ECONNABORTED`, `ECONNRESET`, `ETIMEDOUT`
- Status codes: `503`, `422`, `408`, `429`
- All `5xx` server errors

## Error Conversion

The builder automatically converts Axios errors to typed API exceptions:

| HTTP Status | Exception |
|-------------|-----------|
| 400 | `ApiBadRequestException` |
| 401 | `ApiUnauthorizedException` |
| 403 | `ApiForbiddenException` |
| 404 | `ApiNotFoundException` |
| 408 | `ApiTimeoutException` |
| 409 | `ApiConflictException` |
| 422 | `ApiUnprocessableEntityException` |
| 5xx | `ApiInternalServerException` |

Every error also includes a **ready-to-use cURL command** to reproduce the failed request:

```typescript
try {
  await this.http.post('https://api.example.com/orders', { items: [...] })
} catch (error) {
  // error.curl = "curl -X POST 'https://api.example.com/orders' -H 'Content-Type: application/json' -d '{\"items\":[...]}'"
  // Just copy, paste, and test!
}
```

## IHttpAdapter Interface

```typescript
abstract class IHttpAdapter {
  abstract instance(): AxiosInstance
  abstract get<Response>(url: string, config?): Promise<Response>
  abstract post<Response, Request>(url: string, data?, config?): Promise<Response>
  abstract put<Response, Request>(url: string, data?, config?): Promise<Response>
  abstract patch<Response, Request>(url: string, data?, config?): Promise<Response>
  abstract delete<Response>(url: string, config?): Promise<Response>
  abstract request(): IHttpBuilder
}
```

## Related

- [AxiosUtils](../utils/axios.md) — Retry and error sanitization implementation
- [TracingInterceptor](../middlewares/tracing.interceptor.md) — `request.tracing.axios()` for traceid propagation
