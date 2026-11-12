# RequestTimeout Decorator

Simple decorator that sets a route's local timeout limit. The
[RequestTimeoutInterceptor](../../src/middlewares/interceptors/request-timeout.interceptor.ts)
applies that limit while honoring an earlier upstream `X-Request-Deadline`, if present.

## ⚠️ Important: HTTP timeout alone does not protect the database

`@RequestTimeout` only changes **when the HTTP response gives up on the client**.
It does **not** cancel the work still running on the server — including any
Postgres query/transaction in progress. The [RxJS `timeout()` operator](../middlewares/request-timeout.interceptor.md)
just stops listening to the `Observable`; it does not abort the underlying
Promise or close the database connection.

By default, Postgres connections use a fixed, global `statement_timeout`
derived from `DEPENDENCY_TIMEOUT_MS` (see [timeout-budget.md](../infra/timeout-budget.md)),
which is always **lower** than the default `HTTP_REQUEST_TIMEOUT_MS`. This
keeps the chain safe out of the box: the database always cancels a slow query
before the HTTP timeout would even trigger.

**If you raise `@RequestTimeout` above the default to allow a legitimately
slower route** (e.g. a heavy report), the database side does **not** scale
with it automatically — the query will still be cut off by the global,
shorter `statement_timeout`. Using `@RequestTimeout(180000)` alone on a route
that depends on a long-running query is misleading: the client will wait
longer, but the query still dies early, so the longer HTTP budget does
nothing useful.

To extend a route safely, you must override **both** sides together,
explicitly, in the use-case itself — never rely on `@RequestTimeout` alone
when the slow part is a database call:

```typescript
import { RequestTimeout } from '@/utils/decorators'

@Controller('reports')
export class ReportController {
  @Post('heavy-report')
  @RequestTimeout(30000) // HTTP side: new ceiling for this route
  async generateReport() {
    // DB side: must be extended too, with a safety margin below 30000ms,
    // otherwise this call keeps using the short global statement_timeout
    return this.userRepository.withDeadline(28000, async (repository) => {
      return repository.find(...)
    })
  }
}
```

If a route only does fast, simple queries, `@RequestTimeout` has nothing to
compensate for and the global timeout is enough — no override needed on
either side.

## The Timeout Problem

Without per-route timeout control, applications face timeout management issues:

```typescript
// ❌ PROBLEM: One timeout for all routes
// (global timeout comes from HTTP_REQUEST_TIMEOUT_MS, applied via RequestTimeoutInterceptor)

@Post('quick-operation')  
async quickOp() {
  // Fast operation limited by the global timeout
  return this.service.quickProcess()
}

@Post('heavy-report')
async generateReport() {
  // Heavy operation that needs more time than the global timeout - will timeout!
  return this.service.generateLargeReport() // Takes 2 minutes
}
```

## Simple Timeout Override

The `@RequestTimeout` decorator provides **effortless timeout customization**:

```typescript
import { RequestTimeout } from '@/utils/decorators'

@Controller('operations')
export class OperationController {
  
  @Post('quick-operation')
  @RequestTimeout(5000) // 5 seconds - faster than default
  async quickOp() {
    return this.service.quickProcess()
  }

  @Post('heavy-report')  
  @RequestTimeout(180000) // 3 minutes - longer than default
  async generateReport() {
    return this.service.generateLargeReport()
  }

  @Post('standard-operation')
  // No decorator = uses global timeout
  async standardOp() {
    return this.service.standardProcess()
  }
}
```

The timeout must be a positive integer in milliseconds. Invalid configuration
such as `@RequestTimeout(0)`, negative values, fractional values, or `NaN`
throws during application setup.

## How It Works with RequestTimeoutInterceptor

### **Timeout Resolution**

The [RequestTimeoutInterceptor](../../src/middlewares/interceptors/request-timeout.interceptor.ts)
uses the earliest deadline. `X-Request-Deadline` is an absolute Unix timestamp in
milliseconds and can shorten the route's local timeout, but can never extend it:

```typescript
const localTimeout = requestTimeout ?? HTTP_REQUEST_TIMEOUT_MS
const finalDeadline = resolveEffectiveDeadline(upstreamDeadline, localTimeout)

// @RequestTimeout (when present) defines the route's local maximum.
// Otherwise HTTP_REQUEST_TIMEOUT_MS is the local maximum.
// X-Request-Deadline can only make the effective deadline earlier.
```

Malformed deadline headers return `400`; already-expired deadlines return `408`.
Because this header is caller-controlled, the local timeout remains the hard upper
bound. Keep clocks synchronized between services because the header carries an
absolute timestamp.

### **Integration Example**

```typescript
// interceptors/module.ts - Global interceptor setup (already wired in the project)
@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useFactory: (reflector: Reflector) => new RequestTimeoutInterceptor(reflector),
      inject: [Reflector]
    }
  ]
})
export class InterceptorsModule {}

// controller.ts - Route-specific overrides
@Controller('files')
export class FileController {
  
  @Get('list')
  // No decorator = uses the global HTTP_REQUEST_TIMEOUT_MS
  async listFiles() {
    return this.fileService.list()
  }

  @Post('upload')
  @RequestTimeout(120000) // Override: 2 minutes for uploads
  async uploadFile(@Req() { body }: ApiRequest) {
    return this.fileService.upload(body)
  }

  @Post('process')
  @RequestTimeout(300000) // Override: 5 minutes for processing
  async processFile(@Req() { body }: ApiRequest) {
    return this.fileService.process(body)
  }
}
```

## Real-World Usage Patterns

### **API Response Time Optimization**

```typescript
@Controller('api')
export class ApiController {
  
  @Get('health')
  @RequestTimeout(2000) // Health checks must be fast
  async healthCheck() {
    return { status: 'ok' }
  }

  @Get('user-profile')
  @RequestTimeout(10000) // User data should load quickly
  async getUserProfile(@Param('id') id: string) {
    return this.userService.getProfile(id)
  }

  @Post('generate-report')
  @RequestTimeout(600000) // Reports can take up to 10 minutes
  async generateReport(@Req() { body }: ApiRequest) {
    // ⚠️ remember to also extend the DB side (e.g. withDeadline), see the
    // warning at the top of this document — HTTP alone does not help here
    return this.reportService.generate(body)
  }
}
```

### **Error Handling**

When timeout occurs, the interceptor automatically converts errors:

```typescript
// Timeout exceeded response
{
  "statusCode": 408,
  "message": "Request Timeout. Limit: 30000ms exceeded.",
  "error": "Request Timeout"
}
```

## Implementation Benefits

### **🎯 Granular Control**
- **Route-specific timeouts** instead of global limits
- **Per-operation optimization** based on expected duration
- **Flexible timeout management** without code complexity

### **⚡ Simple API**
- **Single decorator** to override timeout
- **No configuration objects** or complex setup
- **Millisecond precision** for exact timeout control

### **🛡️ Automatic Error Handling**
- **Consistent timeout exceptions** across application
- **Clear error messages** with actual timeout values
- **RxJS timeout operator** for reliable timeout detection

### **🔧 Seamless Integration**
- **Works with existing interceptor** setup
- **Metadata-based configuration** using NestJS patterns
- **Reflector integration** for automatic metadata extraction

## Why This Pattern Works

The combination of `@RequestTimeout` decorator + `RequestTimeoutInterceptor` provides:

1. **Simplicity**: Just add `@RequestTimeout(ms)` to any route
2. **Flexibility**: Different timeouts for different operations  
3. **Maintainability**: Clear timeout intentions in controller code
4. **Consistency**: Unified timeout handling across the application

This decorator **eliminates the need for complex timeout configuration** while providing powerful per-route timeout control, making timeout management as simple as adding a single line of code.