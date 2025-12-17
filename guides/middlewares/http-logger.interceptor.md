# HTTP Logger Interceptor

Interceptor that ensures every request has a **traceId** for end-to-end observability. If the request doesn't have one, it generates a UUID. Also adds **context** (class/method) to every request.

## What It Does

1. **Reuses or generates traceId** - uses existing header or creates UUID
2. **Sets global logger parameter** - all logs include traceId
3. **Adds context** - `ClassName/methodName` to request

## TraceId Propagation

If the calling application sends a `traceid` header, it will be **reused**. This enables **distributed tracing** across multiple services:

```
┌─────────────────┐     traceid: abc-123     ┌─────────────────┐
│   App A         │ ────────────────────────▶│   App B (this)  │
│  (Frontend)     │                          │   (API)         │
└─────────────────┘                          └─────────────────┘
        │                                            │
        │ Logs with abc-123                          │ Logs with abc-123
        ▼                                            ▼
   ┌─────────┐                                  ┌─────────┐
   │  Loki   │  ◀── Same traceId ──▶           │  Loki   │
   └─────────┘                                  └─────────┘
```

**Result:** All logs from App A AND App B can be filtered by the same traceId!

## Context Auto-Assignment

Every request gets a `context` property automatically:

```typescript
// Request to UserController.create()
request.context = "UserController/create"

// Request to AuthService.login()
request.context = "AuthService/login"
```

This context appears in error responses (unless overwritten by your code).

## The Power of TraceId

The `traceId` is the **single identifier** that connects everything in your observability stack:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ONE REQUEST, ONE TRACEID                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Request arrives ──▶ traceId: "abc-123-def"                                │
│                              │                                               │
│           ┌──────────────────┼──────────────────┐                           │
│           ▼                  ▼                  ▼                            │
│      ┌─────────┐       ┌─────────┐        ┌─────────┐                       │
│      │  Logs   │       │ Traces  │        │  Error  │                       │
│      │ (Loki)  │       │(Zipkin) │        │Response │                       │
│      └─────────┘       └─────────┘        └─────────┘                       │
│           │                  │                  │                            │
│      Filter by:        Filter by:         Included in:                      │
│      traceid=abc..     traceid=abc..      error.traceid                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Where TraceId Appears

| Location | How to Find |
|----------|-------------|
| **Logs (Loki)** | `{traceid="abc-123-def"}` |
| **Traces (Zipkin)** | Search by traceId |
| **Error Response** | `error.traceid` field (see [exception-handler.filter.md](./exception-handler.filter.md)) |
| **All log entries** | Every `logger.info()`, `logger.error()` includes it |

## Example Flow

```bash
# 1. Request arrives without traceId
POST /api/users

# 2. Interceptor generates: traceid = "abc-123-def"

# 3. All logs from this request have the traceId:
{"level":"info","traceid":"abc-123-def","message":"Creating user..."}
{"level":"info","traceid":"abc-123-def","message":"User created"}
{"level":"info","traceid":"abc-123-def","message":"Sending welcome email..."}

# 4. If error occurs, response includes it:
{"error":{"traceid":"abc-123-def","message":["User already exists"]}}

# 5. In Loki: {traceid="abc-123-def"} → shows ALL 3 logs
# 6. In Zipkin: search "abc-123-def" → shows full trace
```

## Why It Matters

**Without traceId:**
- Thousands of logs mixed together
- Impossible to track a single request
- Debugging is guesswork

**With traceId:**
- Filter all logs from ONE request instantly
- See the full journey in Zipkin
- Correlate errors with their context
- Production debugging becomes possible

## Summary

| Feature | Description |
|---------|-------------|
| **Generates** | UUID if no traceId in headers |
| **Sets** | Global logger parameter |
| **Appears in** | Logs, Traces, Error responses |
| **Filter in** | Loki, Zipkin by traceId |

**HTTP Logger Interceptor** - *The glue that connects all your observability data.*
