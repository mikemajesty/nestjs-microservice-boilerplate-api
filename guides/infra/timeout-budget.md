# Timeout Budget

Single source of truth for the "dependency timeout" ceiling used by outbound dependencies (HTTP clients and database connections). It derives a safe value from `HTTP_REQUEST_TIMEOUT_MS` so a stuck dependency cancels/aborts **before** the HTTP layer would respond with a `408`, keeping the timeout chain coherent:

```
dependency timeout < HTTP_REQUEST_TIMEOUT_MS < server.timeout < proxy < client
```

## What it solves

Without this, each database connection config could set its own hardcoded timeout (e.g. `statement_timeout: 30000`) independent of `HTTP_REQUEST_TIMEOUT_MS` (e.g. `5000`). If the HTTP timeout is lower than the dependency timeout, the interceptor returns `408` while the query keeps running on the server — wasting connections/CPU and breaking the "fail fast at the innermost layer" principle.

`DEPENDENCY_TIMEOUT_MS` guarantees the dependency ceiling is always a safety margin below `HTTP_REQUEST_TIMEOUT_MS`, and throws on boot if that invariant is ever violated (e.g. someone sets the margin larger than the HTTP timeout).

## How to use

Import the constant wherever an outbound dependency or connection pool config needs a timeout:

```typescript
import { DEPENDENCY_TIMEOUT_MS } from '@/infra/database/timeout-budget'

// Postgres (src/infra/database/postgres/pool-options.ts)
extra: {
  query_timeout: DEPENDENCY_TIMEOUT_MS,     // client-side (driver `pg`)
  statement_timeout: DEPENDENCY_TIMEOUT_MS  // server-side (Postgres cancels the statement)
}

// Mongo (src/infra/database/mongo/module.ts)
socketTimeoutMS: DEPENDENCY_TIMEOUT_MS

// HTTP (src/infra/http/service.ts)
timeout: DEPENDENCY_TIMEOUT_MS
```

## Notes

- Based on `process.env.HTTP_REQUEST_TIMEOUT_MS` directly (not `ConfigService`), so it works both in the app runtime and in standalone scripts (e.g. the migration CLI) that have no DI container.
- `DEPENDENCY_SAFETY_MARGIN_MS` (default `1000`) is the gap subtracted from `HTTP_REQUEST_TIMEOUT_MS`. Adjust it only if you also understand the trade-off: a smaller margin leaves less room for the app to handle the dependency error and still respond before the HTTP timeout fires.
- This covers single-query routes. For routes that run multiple sequential queries, a static per-query ceiling can still sum past the total HTTP budget — in that case, prefer a dedicated `QueryRunner`/transaction with a timeout sized for the whole operation instead of applying `DEPENDENCY_TIMEOUT_MS` to each query independently.
