# RequestTimeoutInterceptor

Global interceptor that **limits HTTP request execution time**, throwing `ApiTimeoutException` when the limit is exceeded. Works together with the [@RequestTimeout](../decorators/request-timeout.md) decorator to allow granular per-route configuration.

## Timeout Hierarchy

```
@RequestTimeout(5000)  →  globalTimeout  →  DEFAULT_FALLBACK (60s)
     (decorator)           (constructor)        (safety net)
```

| Priority | Source | Description |
|:--------:|--------|-------------|
| 1️⃣ | `@RequestTimeout` | Value defined on handler or controller |
| 2️⃣ | `globalTimeout` | Value passed to interceptor constructor |
| 3️⃣ | `DEFAULT_FALLBACK` | 60 seconds (safety fallback) |

## Execution Flow

```
Request → Interceptor → Set timeout → Handler executes
                                              │
                        ┌─────────────────────┴─────────────────────┐
                        │                                           │
                   Responds OK                              Exceeds timeout
                   (within limit)                                 │
                                                                  ↓
                                                    ApiTimeoutException (408)
```

## Global Configuration

```typescript
// app.module.ts
{
  provide: APP_INTERCEPTOR,
  useFactory: (reflector: Reflector) => new RequestTimeoutInterceptor(reflector, 30000), // 30s default
  inject: [Reflector]
}
```

## Related

- [@RequestTimeout Decorator](../decorators/request-timeout.md) — for per-route override
- [ApiTimeoutException](../utils/exception.md) — HTTP 408 exception
