# Logger

Structured logging service built on **Pino** with automatic shipping to **Grafana Loki**. Features automatic **traceId propagation**, **cURL generation** for requests, and **pretty console output** in development.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           LOGGING FLOW                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Your Code                                                                  │
│      │                                                                      │
│      │ logger.info({ message: '...' })                                      │
│      ▼                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  LoggerService (Pino)                                                │   │
│  │                                                                      │   │
│  │  Enriches with:                                                      │   │
│  │  • traceid (from request or generated)                              │   │
│  │  • application name                                                  │   │
│  │  • context (controller/method)                                       │   │
│  │  • createdAt timestamp                                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                    │                                                        │
│          ┌────────┴────────┐                                               │
│          ▼                 ▼                                               │
│   ┌─────────────┐   ┌─────────────┐                                        │
│   │  Console    │   │  Loki       │                                        │
│   │  (Pretty)   │   │  (JSON)     │                                        │
│   │             │   │             │                                        │
│   │  level:     │   │  level:     │                                        │
│   │  trace+     │   │  info+      │                                        │
│   └─────────────┘   └─────────────┘                                        │
│         │                 │                                                │
│         ▼                 ▼                                                │
│   Terminal Output    Grafana Loki                                          │
│   (Development)      (Production)                                          │
│                           │                                                │
│                           ▼                                                │
│                      ┌─────────────┐                                       │
│                      │  Grafana    │                                       │
│                      │  Dashboard  │                                       │
│                      └─────────────┘                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Log Levels

| Level | Method | When to Use | Sent to Loki |
|-------|--------|-------------|--------------|
| `trace` | - | Internal pino level | ❌ |
| `debug` | `logger.debug()` | Development debugging | ❌ |
| `info` | `logger.info()` | Normal operations | ✅ |
| `warn` | `logger.warn()` | Potential issues | ✅ |
| `error` | `logger.error()` | Errors (caught) | ✅ |
| `fatal` | `logger.fatal()` | Critical errors (app exits) | ✅ |

## ILoggerAdapter Interface

```typescript
abstract class ILoggerAdapter {
  abstract logger: HttpLogger
  abstract connect(logLevel?: LogLevelEnum): void
  abstract setApplication(app: string): void
  abstract setGlobalParameters(input: object): void
  abstract log(message: string): void
  abstract debug({ message, context, obj }): void
  abstract info({ message, context, obj }): void
  abstract warn({ message, context, obj }): void
  abstract error(error: ErrorType, message?: string): void
  abstract fatal(error: ErrorType, message?: string): void
}
```

## Usage Examples

### `logger.info()` — Normal Operations

```typescript
@Injectable()
export class OrderService {
  constructor(private readonly logger: ILoggerAdapter) {}
  
  async createOrder(data: CreateOrderDTO) {
    this.logger.info({
      message: 'Creating new order',
      context: 'OrderService.createOrder',
      obj: { 
        userId: data.userId, 
        itemsCount: data.items.length,
        totalValue: data.totalValue
      }
    })
    
    // ... create order
    
    this.logger.info({
      message: 'Order created successfully',
      context: 'OrderService.createOrder',
      obj: { orderId: order.id }
    })
  }
}
```

**Output (Console):**
```
INFO [2025-12-17 10:30:45]: [nestjs-microservice-boilerplate-api] Creating new order
```

**Output (Loki JSON):**
```json
{
  "level": "info",
  "message": "Creating new order",
  "context": "OrderService.createOrder",
  "traceid": "abc-123-def-456",
  "application": "nestjs-microservice-boilerplate-api",
  "createdAt": "2025-12-17T10:30:45.000Z",
  "userId": "user-123",
  "itemsCount": 3,
  "totalValue": 299.99
}
```

### `logger.debug()` — Development Only

```typescript
async processPayment(orderId: string) {
  this.logger.debug({
    message: 'Payment processing started',
    context: 'PaymentService.processPayment',
    obj: { orderId, gateway: 'stripe' }
  })
  
  // Debug logs are NOT sent to Loki (level: trace in console only)
}
```

### `logger.warn()` — Potential Issues

```typescript
async findUser(id: string) {
  const user = await this.userRepository.findById(id)
  
  if (!user.emailVerified) {
    this.logger.warn({
      message: 'User accessing system without verified email',
      context: 'UserService.findUser',
      obj: { userId: id, email: user.email }
    })
  }
  
  return user
}
```

**Output (Loki JSON):**
```json
{
  "level": "warn",
  "message": "User accessing system without verified email",
  "context": "UserService.findUser",
  "traceid": "abc-123-def-456",
  "application": "nestjs-microservice-boilerplate-api",
  "createdAt": "2025-12-17T10:30:45.000Z",
  "userId": "user-123",
  "email": "john@example.com"
}
```

### `logger.error()` — Caught Errors

```typescript
async chargeCustomer(customerId: string, amount: number) {
  try {
    await this.paymentGateway.charge(customerId, amount)
  } catch (error) {
    this.logger.error(error, 'Payment charge failed')
    throw new ApiPaymentException('Payment failed')
  }
}
```

**Output (Loki JSON):**
```json
{
  "level": "error",
  "message": ["Payment charge failed"],
  "context": "PaymentService.chargeCustomer",
  "type": "ApiPaymentException",
  "traceid": "abc-123-def-456",
  "application": "nestjs-microservice-boilerplate-api",
  "createdAt": "2025-12-17T10:30:45.000Z",
  "statusCode": 402,
  "stack": "Error: Payment failed at PaymentService.chargeCustomer..."
}
```

### `logger.fatal()` — Critical (App Exits)

```typescript
async connectDatabase() {
  try {
    await this.database.connect()
  } catch (error) {
    this.logger.fatal(error, 'Database connection failed - cannot start application')
    // App exits with process.exit(1) after fatal log
  }
}
```

## TraceId Propagation

The logger automatically includes `traceid` in **every single log**, enabling **distributed tracing** across microservices. 

The [HttpLoggerInterceptor](../middlewares/http-logger.interceptor.md) sets the traceid globally via `setGlobalParameters()`, so you **never need to manually add it** — all your logs will automatically carry the same traceid.

```typescript
// HttpLoggerInterceptor does this automatically:
this.logger.setGlobalParameters({ traceid: request.id })

// Now ALL your logs include traceid without you doing anything:
this.logger.info({ message: 'Processing order' })
// Output: { traceid: "abc-123", message: "Processing order", ... }

this.logger.warn({ message: 'Low inventory' })  
// Output: { traceid: "abc-123", message: "Low inventory", ... }

this.logger.error(error)
// Output: { traceid: "abc-123", error: ..., ... }
```

This means you can search for a single traceid in Grafana Loki and see **ALL logs** from that request, across all services.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       TRACEID IN LOGS                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Request arrives                                                            │
│      │                                                                      │
│      │ traceid: "abc-123" (from header or generated)                        │
│      ▼                                                                      │
│  HttpLoggerInterceptor                                                      │
│      │                                                                      │
│      │ logger.setGlobalParameters({ traceid: "abc-123" })                   │
│      ▼                                                                      │
│  All subsequent logs automatically include traceid                          │
│                                                                             │
│  Log 1: { traceid: "abc-123", message: "Processing order..." }             │
│  Log 2: { traceid: "abc-123", message: "Validating user..." }              │
│  Log 3: { traceid: "abc-123", message: "Charging payment..." }             │
│                                                                             │
│  In Grafana: Filter by traceid to see ENTIRE request journey               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Grafana Loki Query:**
```
{job="nestjs"} | json | traceid="abc-123-def-456"
```

## Automatic cURL Generation on Errors

Every time an error occurs, the logger automatically generates a **cURL command** to reproduce the exact request. This is powered by [convert-pino-request-to-curl](https://github.com/mikemajesty/convert-pino-request-to-curl).

**Without this feature:**
```
❌ Error logged: "Validation failed"
   
   Developer: "What was the request body? Headers? URL?"
   *Manually reconstructs curl from scattered log data*
   *Wastes 10 minutes*
```

**With automatic cURL:**
```
✅ Error logged with ready-to-use curl:

curl -X POST 'http://localhost:3000/users' \
  -H 'Content-Type: application/json' \
  -H 'traceid: abc-123' \
  -d '{"email":"john@example.com","name":"John"}'

   Developer: *Copy, paste, test* ✨
```

### Sensitive Fields Omission

You can configure which fields to hide from the generated cURL:

```typescript
PinoRequestConverter.getCurl(request, ['password', 'cpf', 'authorization', 'token'])
```

The cURL will be generated **without** these sensitive values, making it safe to share in logs.

For more details, see the [library documentation](https://github.com/mikemajesty/convert-pino-request-to-curl).

## HTTP Request Logging

The logger automatically logs HTTP requests with:

| Field | Description |
|-------|-------------|
| `method` | HTTP method (GET, POST, etc) |
| `curl` | cURL command to reproduce the request |
| `path` | Full URL path |
| `timeTaken` | Response time in ms |
| `traceid` | Request trace ID |

**Automatic cURL Generation:**
```json
{
  "request": {
    "method": "POST",
    "curl": "curl -X POST 'http://localhost:3000/users' -H 'Content-Type: application/json' -d '{\"email\":\"john@example.com\"}'"
  }
}
```

Sensitive fields (`password`, `cpf`) are automatically filtered from the cURL.

## Loki Integration

Logs are shipped to Grafana Loki with:

```typescript
lokiTransport({
  host: process.env.LOKI_URL,
  labels: { job: 'nestjs' },
  interval: 5  // Batch logs every 5 seconds
})
```

**Grafana Queries:**

```logql
# All error logs
{job="nestjs"} | json | level="error"

# Errors for specific user
{job="nestjs"} | json | level="error" | userId="user-123"

# Slow requests (> 1000ms)
{job="nestjs"} | json | timeTaken > 1000

# All logs for a trace
{job="nestjs"} | json | traceid="abc-123-def-456"

# Logs from specific context
{job="nestjs"} | json | context="OrderService.createOrder"
```

## Request Scoped

The logger is **request-scoped** (`Scope.REQUEST`), meaning each request gets its own logger instance with isolated bindings (traceid, context, etc).

```typescript
@Injectable({ scope: Scope.REQUEST })
export class LoggerService implements ILoggerAdapter {
  // Each request has isolated logger state
}
```

## Related

- [HttpLoggerInterceptor](../middlewares/http-logger.interceptor.md) — TraceId generation and propagation
- [TracingInterceptor](../middlewares/tracing.interceptor.md) — Distributed tracing with OpenTelemetry
- [Secrets](./secrets.md) — `LOKI_URL` and `LOG_LEVEL` configuration
