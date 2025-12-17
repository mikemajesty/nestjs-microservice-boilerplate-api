# Middlewares

> **Note:** The `middlewares` folder is purely an **organizational grouping**. It contains NestJS Guards, Interceptors, and Filters — each with distinct roles in the request lifecycle. The choice to group them under a single folder was made solely for **project organization purposes**.

## Request Lifecycle

```
Request → Guards → Interceptors (before) → Handler → Interceptors (after) → Filters (on error) → Response
```

| Type | Purpose | When Runs |
|------|---------|-----------|
| **Guards** | Authorization, access control | Before handler |
| **Interceptors** | Transform request/response, logging, tracing | Before & after handler |
| **Filters** | Error handling, exception formatting | On exceptions |

## Guards

| Guide | Implementation | Description |
|-------|----------------|-------------|
| [Authorization Guard](./authorization.guard.md) | [authorization.guard.ts](../../src/middlewares/guards/authorization.guard.ts) | RBAC permission checking via `@Permission` decorator |

## Interceptors

| Guide | Implementation | Description |
|-------|----------------|-------------|
| [Tracing Interceptor](./tracing.interceptor.md) | [tracing.interceptor.ts](../../src/middlewares/interceptors/tracing.interceptor.ts) | Distributed tracing with OpenTelemetry, auto traceid propagation |
| [HTTP Logger Interceptor](./http-logger.interceptor.md) | [http-logger.interceptor.ts](../../src/middlewares/interceptors/http-logger.interceptor.ts) | TraceId generation and context assignment for logs |
| [Metrics Interceptor](./metrics.interceptor.md) | [metrics.interceptor.ts](../../src/middlewares/interceptors/metrics.interceptor.ts) | HTTP metrics collection for Prometheus/Grafana |
| [Request Timeout Interceptor](./request-timeout.interceptor.md) | [request-timeout.interceptor.ts](../../src/middlewares/interceptors/request-timeout.interceptor.ts) | Per-route timeout control |
| [Exception Handler Interceptor](./exception-handler.interceptor.md) | [exception-handler.interceptor.ts](../../src/middlewares/interceptors/exception-handler.interceptor.ts) | Error catching and tracing finalization |

## Filters

| Guide | Implementation | Description |
|-------|----------------|-------------|
| [Exception Handler Filter](./exception-handler.filter.md) | [exception-handler.filter.ts](../../src/middlewares/filters/exception-handler.filter.ts) | Standardizes and sanitizes all API error responses |

## Middlewares (NestJS)

| Guide | Implementation | Description |
|-------|----------------|-------------|
| [Authentication Middleware](./authentication.middleware.md) | [authentication.middleware.ts](../../src/middlewares/middlewares/authentication.middleware.ts) | JWT token validation and user injection |
