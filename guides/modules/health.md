# Health

The health module exposes the Kubernetes probes, a metrics snapshot and an HTML dashboard.
All routes are `@Public()` and excluded from the `api` prefix, tracing and HTTP metrics.

📄 Code: [`src/modules/health/`](../../src/modules/health/) · Spec: [`api-spec/src/modules/health/`](../../api-spec/src/modules/health/)

---

## Endpoints

| Route | Purpose | Consumer | Fails with | Cached |
|-------|---------|----------|------------|--------|
| `GET /health/live` | Process is alive | `livenessProbe` | — | — |
| `GET /health/startup` | Mongo, Postgres and Redis connected | `startupProbe` | 503 | 2s |
| `GET /health/ready` | Mongo, Postgres and Redis answer, with latency | `readinessProbe` | 503 | 2s |
| `GET /health/metrics` | Process, runtime and dependency metrics | Dashboard, humans | — | 5s |
| `GET /health/dashboard` | HTML panel over the routes above | Browser | — | — |
| `GET /` | Same response as `/health/live` | Load balancers | — | — |

`/health/live` and `/` share one builder, so both liveness probes always answer the same way.

### Why `/ready` and `/metrics` are separate

Readiness answers one question: can this pod receive traffic? That depends on the dependencies, so
`/ready` runs three cheap checks (`ping` on Mongo, `SELECT 1` on Postgres, `PING` on Redis), each with a
2s timeout, below the 5s `timeoutSeconds` of the probes in
[`gitops/apps/boilerplate-app/deployment.yaml`](../../gitops/apps/boilerplate-app/deployment.yaml).

Memory, CPU, GC and connection counts do not change that answer, so they live in `/metrics`. This keeps
the probe fast and keeps orchestrator traffic away from the metrics window.

```json
// GET /health/ready
{
  "status": "UP 🟢",
  "version": "1.1.19",
  "timestamp": "2026-11-18T19:42:20.410Z",
  "checkedAt": "2026-11-18T19:42:19.830Z",
  "dependencies": {
    "mongo": { "status": "UP 🟢", "latencyMs": 2.39 },
    "postgres": { "status": "UP 🟢", "latencyMs": 2.24 },
    "redis": { "status": "UP 🟢", "latencyMs": 1.53 }
  }
}
```

---

## Micro-cache

The routes are public, so a burst of requests must not become a burst of database calls. Each cached
route costs **at most one collection per TTL**, however many requests arrive:

- a cache **hit** is answered from memory;
- concurrent **misses** share one collection ([Single Flight](../utils/single-flight.md));
- values are stored as JSON, so every caller gets its own copy.

| Entry | TTL | Why this value |
|-------|-----|----------------|
| Dependency checks | 2s | Far below the probe's `periodSeconds: 10`: a failure or recovery shows up at most 2s later |
| Metrics snapshot | 5s | Below the dashboard's 30s refresh, so every refresh still gets a new sample |

- `/ready` and `/startup` share the same cached checks. The HTTP status (200/503) is still computed per
  request from them.
- A DOWN result is cached too: recovery is reported up to 2s later.
- In `/ready` and `/startup`, `timestamp` follows each request and `checkedAt` is when the checks ran:
  within the TTL, `checkedAt` and the latencies repeat.
- In `/metrics`, `timestamp` is when the snapshot was **collected**, not when the request arrived.

The cache is health's own in-memory instance, bound to `IHealthCacheAdapter` so it never clashes with the
Redis `ICacheAdapter` the module also uses. See
[Same Adapter, Different Implementations](./module.md#same-adapter-different-implementations).

---

## Reading `/health/metrics`

### The window

`eventLoopLag`, `gc` and `process.cpu` are aggregated **since the previous collection**, then reset.
`window.seconds` tells how long that was. Collections happen at most once every 5s, so extra viewers or
request bursts do not shrink the window.

### Fields

| Field | Source | How to read it |
|-------|--------|----------------|
| `process.hostname` | `os.hostname()` | Pod name in Kubernetes: which replica answered |
| `process.cpu.usagePercent` | `process.cpuUsage()` | CPU of **this process**. 100% = one full core |
| `memory.process.usedRam` | RSS | Physical memory. Can be lower than `heapTotal` right after boot (untouched committed pages, macOS compression) |
| `memory.process.heapUsed` | `process.memoryUsage()` | Live JS objects |
| `memory.container` | `process.constrainedMemory()` | cgroup limit and RSS %. `null` outside containers. Near 100% means OOMKill risk |
| `memory.heapSpaces` | `v8.getHeapSpaceStatistics()` | `old_space.used` rising across reads = leak. `new_space` churn is normal |
| `eventLoopLag` | `monitorEventLoopDelay` | Real delay: the 20ms sampler resolution is already subtracted. p99 > 50ms hurts latency |
| `gc` | `PerformanceObserver('gc')` | `count` also includes incremental and weak-callback GCs. Frequent `major` or long `maxPauseMs` explain lag spikes |
| `network.connections` | `server.getConnections()` | Open TCP sockets (keep-alive included), not requests in flight |
| `cpu` | `os.loadavg()`, `systeminformation` | **Host-wide**: every process on the machine |
| `mongo.connection` | `serverStatus` | **Server-wide**: all clients of the Mongo server |
| `mongo.memory` | `serverStatus.wiredTiger.cache` | `null` on DocumentDB, which has no WiredTiger |
| `postgres.connection` | `pg_stat_activity` | `current`/`active` for the app database; `available` for the whole server |
| `postgres.databaseSizeBytes` | `pg_database_size(current_database())` | App database only |
| `redis` | `INFO` | `evictedKeys` growing means `maxMemory` is too small |

HTTP request rate, latency percentiles and 5xx rate are not here: they are exported through
OpenTelemetry (see `main.ts`) and live in Grafana.

---

## Dashboard

`GET /health/dashboard` serves [`dashboard.html`](../../src/modules/health/dashboard.html): one file, no
external assets.

- Polls `/live`, `/startup`, `/ready` and `/metrics` every 30s by default; pauses while the tab is hidden.
- The file is copied to `dist` by the SWC build (`copyFiles: true` in `nest-cli.json`) and read once at
  module load. **Restart the app** after editing it.
- The global helmet CSP blocks inline scripts, so the route sends its own CSP with a per-request nonce
  that replaces the `{{nonce}}` placeholders.
- Usage bars are hidden when there is no limit (no container limit, Redis without `maxmemory`); any
  non-zero usage keeps a minimum visible width.
- Sparklines keep the last 60 points in the browser tab only (~30 minutes at 30s).

---

## Testing

[`__tests__/controller.spec.ts`](../../src/modules/health/__tests__/controller.spec.ts) runs against real
Mongo, Postgres and Redis (Testcontainers). The micro-cache tests count real calls with `jest.spyOn`
(no mock implementation) and clear the cache before each test:

- two `/metrics` within the TTL reuse one collection;
- ten concurrent `/metrics` collect once;
- `/ready` and `/startup` share one set of checks;
- after the TTL, `/ready` checks again.

---

## Related Links

- [Controller](./controller.md) — HTTP entry point
- [Module](./module.md) — NestJS wiring, including module-scoped adapters
- [Single Flight](../utils/single-flight.md) — Deduplication of concurrent calls
- [Test (E2E)](./test.md) — Integration tests with Testcontainers
- [Docker](../setup/docker.md) — Container `HEALTHCHECK`
