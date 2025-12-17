# TracingInterceptor

The **heart of distributed tracing** in the application. This interceptor automatically creates spans for each HTTP request and provides a complete API for instrumentation, including a **pre-configured Axios client** that automatically propagates the `traceid` between microservices.

## The Distributed Tracing Problem

In microservice architectures, tracing a request that crosses multiple services is a nightmare:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ❌ WITHOUT DISTRIBUTED TRACING                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  User Request                                                               │
│       │                                                                     │
│       ↓                                                                     │
│  ┌─────────┐    HTTP    ┌─────────┐    HTTP    ┌─────────┐                 │
│  │ API     │ ────────→  │ Orders  │ ────────→  │ Payment │                 │
│  │ Gateway │            │ Service │            │ Service │                 │
│  └─────────┘            └─────────┘            └─────────┘                 │
│       │                      │                      │                       │
│       ↓                      ↓                      ↓                       │
│   Log: "Error"          Log: "Error"           Log: "Error"                │
│   ID: ???               ID: ???                ID: ???                      │
│                                                                             │
│   🤷 How do we know if the errors are related?                             │
│   🤷 What was the order of the calls?                                      │
│   🤷 How long did each service take?                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## The Solution: TracingInterceptor

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ✅ WITH DISTRIBUTED TRACING                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  User Request ─────────────── traceid: abc-123 ──────────────────────────  │
│       │                                                                     │
│       ↓                                                                     │
│  ┌─────────┐    HTTP    ┌─────────┐    HTTP    ┌─────────┐                 │
│  │ API     │ ────────→  │ Orders  │ ────────→  │ Payment │                 │
│  │ Gateway │  abc-123   │ Service │  abc-123   │ Service │                 │
│  └─────────┘            └─────────┘            └─────────┘                 │
│       │                      │                      │                       │
│       ↓                      ↓                      ↓                       │
│   Span: 150ms           Span: 80ms             Span: 60ms                  │
│   traceid: abc-123      traceid: abc-123       traceid: abc-123            │
│                                                                             │
│   ✅ All logs connected by the same traceid                                │
│   ✅ Visual timeline in Zipkin/Jaeger                                      │
│   ✅ Time of each service measured automatically                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## TracingType API

The interceptor injects the `tracing` object into each request with the following API:

```typescript
type TracingType = {
  span: Span              // Current OpenTelemetry span
  tracer: Tracer          // Tracer to create child spans
  tracerId: string        // The unique traceid of the request
  
  // Methods
  axios: (config?) => AxiosInstance  // HTTP client with automatic traceid
  setStatus: (status) => void        // Set span status
  logEvent: (name, attrs?) => void   // Add event to span
  addAttribute: (key, value) => void // Add attribute to span
  createSpan: (name, parent?) => Span // Create child span
  finish: () => void                  // End the span
}
```

## Axios with Automatic TraceId ⭐

**This is the most powerful feature of TracingInterceptor.** When you use `request.tracing.axios()`, the `traceid` is **automatically injected** into all HTTP calls:

```typescript
// ❌ WITHOUT TracingInterceptor - Need to set traceid manually EVERY TIME
@Post('create-order')
async createOrder(@Req() request: ApiRequest) {
  const traceid = request.headers.traceid // Get manually
  
  // Call 1 - Set header manually
  const user = await axios.get('http://users-service/user/123', {
    headers: { traceid, authorization: request.headers.authorization }
  })
  
  // Call 2 - Set header manually AGAIN
  const inventory = await axios.get('http://inventory-service/check', {
    headers: { traceid, authorization: request.headers.authorization }
  })
  
  // Call 3 - And again...
  const payment = await axios.post('http://payment-service/charge', data, {
    headers: { traceid, authorization: request.headers.authorization }
  })
  
  // 😫 Repetitive and easy to forget!
}
```

```typescript
// ✅ WITH TracingInterceptor - TraceId injected AUTOMATICALLY
@Post('create-order')
async createOrder(@Req() request: ApiRequest) {
  const http = request.tracing.axios() // Create instance with automatic traceid
  
  // All calls already have traceid + authorization in the header!
  const user = await http.get('http://users-service/user/123')
  const inventory = await http.get('http://inventory-service/check')
  const payment = await http.post('http://payment-service/charge', data)
  
  // 🎉 Clean, no repetition, impossible to forget!
}
```

### Headers Injected Automatically

| Header | Value | Description |
|--------|-------|-------------|
| `traceid` | `request.id` | Unique UUID of the original request |
| `authorization` | `request.headers.authorization` | User's JWT token |

### TraceId Propagation Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                      AUTOMATIC TRACEID PROPAGATION                           │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Frontend/Mobile App                                                         │
│         │                                                                    │
│         │ POST /orders  (no traceid)                                         │
│         ↓                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  API Gateway (TracingInterceptor)                                    │    │
│  │                                                                      │    │
│  │  1. Generates traceid: "abc-123-def-456"                            │    │
│  │  2. Creates OpenTelemetry span                                      │    │
│  │  3. Injects request.tracing with configured axios                   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│         │                                                                    │
│         │ const http = request.tracing.axios()                              │
│         │ http.get('http://orders-service/...')                             │
│         │                                                                    │
│         │ Headers: { traceid: "abc-123-def-456", authorization: "..." }     │
│         ↓                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Orders Service (TracingInterceptor)                                 │    │
│  │                                                                      │    │
│  │  1. Detects traceid in header → USES THE SAME ONE!                  │    │
│  │  2. Creates child span with same traceid                            │    │
│  │  3. Continues propagating in subsequent calls                       │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│         │                                                                    │
│         │ const http = request.tracing.axios()                              │
│         │ http.post('http://payment-service/...')                           │
│         │                                                                    │
│         │ Headers: { traceid: "abc-123-def-456", authorization: "..." }     │
│         ↓                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Payment Service (TracingInterceptor)                                │    │
│  │                                                                      │    │
│  │  1. Same traceid: "abc-123-def-456"                                 │    │
│  │  2. All logs connected!                                             │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  📊 In Zipkin/Jaeger: A single timeline showing ALL services                │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Exponential Retry with Jitter

The axios from `request.tracing.axios()` comes pre-configured with **automatic retry** using exponential backoff:

```typescript
// Internal configuration from AxiosUtils.requestRetry
axiosRetry(axios, {
  retries: 3,                    // Maximum of 3 attempts
  shouldResetTimeout: true,      // Reset timeout on each retry
  
  retryDelay: (retryCount) => {
    const baseDelay = Math.pow(2, retryCount) * 1000  // Exponential
    const jitter = Math.random() * 1000               // Randomization
    return baseDelay + jitter
  }
})
```

### Retry Timeline

```
Attempt 1 (fails)
    │
    ├── Delay: 2^1 * 1000 + jitter = ~2000-3000ms
    ↓
Attempt 2 (fails)
    │
    ├── Delay: 2^2 * 1000 + jitter = ~4000-5000ms
    ↓
Attempt 3 (fails)
    │
    ├── Delay: 2^3 * 1000 + jitter = ~8000-9000ms
    ↓
Attempt 4 (last)
    │
    └── Success or final error
```

### Retry Conditions

| Condition | Status Codes | Description |
|----------|-------------|-------------|
| Network Errors | - | `ECONNABORTED`, `ECONNRESET`, `ETIMEDOUT` |
| Retryable Status | `503`, `422`, `408`, `429` | Service Unavailable, Timeout, Rate Limit |
| Server Errors | `5xx` | All server errors |

### Retry Logs

Each attempt generates a warning log:

```json
{
  "level": "warn",
  "message": "Retry attempt: 2",
  "obj": {
    "statusText": "Service Unavailable",
    "status": 503,
    "url": "http://payment-service/charge",
    "method": "POST"
  }
}
```

## axios-better-stacktrace

The interceptor uses the `axios-better-stacktrace` package to **improve stack traces** from Axios errors:

```typescript
// Without axios-better-stacktrace ❌
AxiosError: Request failed with status code 500
    at settle (node_modules/axios/lib/core/settle.js:19:12)
    at handleLoad (node_modules/axios/lib/adapters/xhr.js:87:7)
    // 😫 Useless stack trace - doesn't show WHERE you called axios!

// With axios-better-stacktrace ✅
AxiosError: Request failed with status code 500
    at OrderService.createOrder (src/modules/order/service.ts:45:23)
    at OrderController.create (src/modules/order/controller.ts:28:18)
    // 🎉 Shows exactly where the error originated in YOUR code!
```

## Error Sanitization + cURL Generation

When an HTTP error occurs, the `interceptAxiosResponseError` from [AxiosUtils](../utils/axios.md) does:

1. **Cleans the stack trace** removing internal Axios noise
2. **Extracts status** from multiple possible sources
3. **Extracts message** from multiple possible sources
4. **Generates cURL** of the failed request (for debugging)

### Automatic cURL Generation

```typescript
// Original error
AxiosError: Request failed with status code 401

// After sanitization - now has .curl!
{
  message: "Unauthorized",
  status: 401,
  curl: "curl -X POST 'https://payment-service/charge' -H 'Content-Type: application/json' -H 'traceid: abc-123' -d '{\"amount\":100}'"
}
```

### Sensitive Fields Removed from cURL

The generated cURL **automatically removes** sensitive data:

| Field | Reason |
|-------|--------|
| `password` | Credentials |
| `cpf` | Personal data (LGPD/GDPR) |
| `authorization` | JWT tokens |
| `token` | Various tokens |

```typescript
// Original request
{
  body: { password: "secret123", email: "user@email.com" },
  headers: { authorization: "Bearer eyJ..." }
}

// Generated cURL (sensitive data filtered)
curl -X POST 'https://api/login' \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@email.com"}'
```

## Creating Custom Spans

Use `createSpan` to instrument internal operations:

```typescript
@Post('process')
async heavyProcess(@Req() request: ApiRequest) {
  const { tracing } = request
  
  // Span for database operation
  const dbSpan = tracing.createSpan('database-query')
  const users = await this.userRepository.findAll()
  dbSpan.end()
  
  // Span for processing
  const processSpan = tracing.createSpan('data-processing')
  const result = this.processData(users)
  processSpan.end()
  
  // Span for external call
  const externalSpan = tracing.createSpan('external-api-call')
  const http = tracing.axios()
  await http.post('https://external-api.com/notify', result)
  externalSpan.end()
  
  return result
}
```

### Visualization in Zipkin

```
┌─ POST /process ─────────────────────────────────────────────────── 250ms ─┐
│                                                                           │
│  ├─ database-query ────────────────────────────── 80ms ─┤                │
│                                                                           │
│            ├─ data-processing ─────────── 50ms ─┤                        │
│                                                                           │
│                        ├─ external-api-call ───────────────── 120ms ─┤   │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

## Adding Events and Attributes

```typescript
@Post('order')
async createOrder(@Req() request: ApiRequest, @Body() body: CreateOrderDTO) {
  const { tracing } = request
  
  // Attributes - span metadata
  tracing.addAttribute('order.items_count', body.items.length)
  tracing.addAttribute('order.total_value', body.totalValue)
  tracing.addAttribute('user.id', request.user.id)
  
  // Events - timestamps
  tracing.logEvent('order.validated')
  
  const order = await this.orderService.create(body)
  tracing.logEvent('order.created', { orderId: order.id })
  
  const http = tracing.axios()
  await http.post('http://notification-service/send', { orderId: order.id })
  tracing.logEvent('notification.sent')
  
  return order
}
```

## Complete Example: Microservice Communication

```typescript
// orders-service/order.controller.ts
@Controller('orders')
export class OrderController {
  
  @Post()
  async create(@Req() request: ApiRequest, @Body() body: CreateOrderDTO) {
    const { tracing } = request
    const http = tracing.axios() // automatic traceid!
    
    tracing.addAttribute('order.value', body.totalValue)
    
    // 1. Validate user in user-service
    tracing.logEvent('validating-user')
    const userSpan = tracing.createSpan('user-service.validate')
    try {
      const { data: user } = await http.get(`http://user-service/users/${body.userId}`)
      userSpan.setStatus({ code: SpanStatusCode.OK })
      tracing.addAttribute('user.email', user.email)
    } finally {
      userSpan.end()
    }
    
    // 2. Check inventory in inventory-service
    tracing.logEvent('checking-inventory')
    const inventorySpan = tracing.createSpan('inventory-service.check')
    try {
      await http.post('http://inventory-service/check', { items: body.items })
      inventorySpan.setStatus({ code: SpanStatusCode.OK })
    } finally {
      inventorySpan.end()
    }
    
    // 3. Process payment in payment-service
    tracing.logEvent('processing-payment')
    const paymentSpan = tracing.createSpan('payment-service.charge')
    try {
      const { data: payment } = await http.post('http://payment-service/charge', {
        amount: body.totalValue,
        userId: body.userId
      })
      paymentSpan.setStatus({ code: SpanStatusCode.OK })
      tracing.addAttribute('payment.id', payment.id)
    } finally {
      paymentSpan.end()
    }
    
    // 4. Create order
    const order = await this.orderService.create(body)
    tracing.logEvent('order.created', { orderId: order.id })
    
    // 5. Notify (fire and forget with same traceid)
    http.post('http://notification-service/send', { 
      type: 'order_created', 
      orderId: order.id 
    }).catch(() => {}) // Best effort
    
    return order
  }
}
```

### Resulting Timeline in Zipkin

```
traceid: abc-123-def-456

├─ POST /orders ────────────────────────────────────────────────────── 450ms
│   │
│   ├─ user-service.validate ──────────────────── 45ms
│   │   └─ GET /users/123 ──────────────────────── 42ms (user-service)
│   │
│   ├─ inventory-service.check ────────────────── 65ms
│   │   └─ POST /check ─────────────────────────── 62ms (inventory-service)
│   │
│   ├─ payment-service.charge ─────────────────── 180ms
│   │   └─ POST /charge ────────────────────────── 175ms (payment-service)
│   │       └─ external-gateway.process ─────────── 150ms (payment makes external call)
│   │
│   └─ notification-service.send ──────────────── 25ms
│       └─ POST /send ──────────────────────────── 22ms (notification-service)

Events:
  • validating-user      @ 0ms
  • checking-inventory   @ 47ms
  • processing-payment   @ 115ms
  • order.created        @ 300ms

Attributes:
  • order.value: 299.99
  • user.email: john@email.com
  • payment.id: pay_abc123
```

## Automatic Attributes

The interceptor automatically adds these attributes to each span:

| Attribute | Example | Description |
|----------|---------|-------------|
| `http.method` | `POST` | HTTP method |
| `http.url` | `/users/:uuid` | Generalized path |
| `context` | `UserController.create` | Controller.method |
| `traceid` | `abc-123-def-456` | Unique tracing ID |
| `http.status_code` | `201` | Response status |

## Related

- [AxiosUtils](../utils/axios.md) — Retry and error sanitization
- [TracingType](../utils/request.md) — Complete tracing type
- [HttpLoggerInterceptor](./http-logger.interceptor.md) — Traceid propagation to logs
- [ExceptionHandlerInterceptor](./exception-handler.interceptor.md) — Span finalization on error
