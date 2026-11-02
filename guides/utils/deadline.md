# Deadline

`Deadline` represents how much time is left for the current inbound HTTP request. The local limit comes from the route's `@RequestTimeout` decorator or `TimeoutBudget.HTTP_REQUEST_TIMEOUT_MS`; an earlier upstream `X-Request-Deadline` can shorten it, but never extend the local limit. Outbound dependencies (HTTP calls, retries) consult it so they cannot be given more time than the inbound request has left.

It's propagated through the request's async call chain using [`AsyncContext`](./async-context.md), so any code reached from the request handler can read the current deadline without it being passed down as a parameter.

## Where it's created

[`RequestTimeoutInterceptor`](../../src/middlewares/interceptors/request-timeout.interceptor.ts) creates the deadline used by the handler and the RxJS `timeout()` operator:

```ts
const localTimeout = requestTimeout ?? TimeoutBudget.HTTP_REQUEST_TIMEOUT_MS
const upstreamDeadline = Deadline.fromHeader(request.headers['x-request-deadline'])
const deadline = resolveEffectiveDeadline(upstreamDeadline, localTimeout)

// The upstream deadline can shorten, but never extend, the local maximum.
```

The deadline is available through the async handler chain — controller, use case,
repository, and outbound HTTP client. This interceptor runs after guards, so its
timeout does not cancel or bound work performed by guards.

## Distributed propagation

`X-Request-Deadline` carries the deadline as Unix epoch milliseconds. `HttpBuilder`
automatically forwards the active deadline on outbound requests, alongside `traceid`.
The receiving service validates the header and takes the earlier of it and its own
route/global timeout. An invalid value returns `400`; an expired deadline returns `408`.

Because this is an absolute timestamp, services should have synchronized clocks.
Treat it as untrusted input: it can reduce the caller's own budget, but cannot raise
the receiving service's configured maximum.

## Where it's read

[`TimeoutBudget.getDependencyTimeoutMs(deadline?)`](../../src/infra/database/timeout-budget.ts) centralizes the "pick the lower of the two" logic:

```ts
static getDependencyTimeoutMs(deadline?: RequestDeadline): number {
  if (!deadline) return TimeoutBudget.DEPENDENCY_TIMEOUT_MS

  return deadline.getTimeoutMs(TimeoutBudget.DEPENDENCY_TIMEOUT_MS)
}
```

It's consumed by both real integration points:

- [`HttpBuilder.execute()`](../../src/infra/http/http-builder.ts) — sets `TimeoutBudget.getDependencyTimeoutMs(getCurrentDeadline())` as the outbound request's Axios `timeout`, unless the caller set an explicit one via `.timeout(ms)`.
- [`AxiosUtils.canScheduleRetry`](../../src/utils/axios.ts) — bounds the retry budget by the remaining deadline, so retries stop once there isn't enough time left for another attempt to plausibly succeed before the inbound request itself times out. An explicit `retryBudgetMs` (set via `.retry({ retryBudgetMs })`) can only ever shrink this budget further, never extend it past the deadline.

When there's no deadline in context — jobs, cron tasks, scripts, anything outside an inbound HTTP request — both call sites fall back to the static `TimeoutBudget.DEPENDENCY_TIMEOUT_MS` ceiling.

## API

```ts
const deadline = Deadline.fromTimeout(5_000) // expires 5s from now

deadline.remainingMs()      // milliseconds left, clamped to 0
deadline.hasExpired()       // remainingMs() === 0
deadline.getTimeoutMs(2_000) // min(remainingMs(), 2_000) — never exceeds either limit
```

`remainingMs()` is clamped to `0` rather than going negative, so `getTimeoutMs` always returns a value safe to pass straight to Axios or any other timeout-accepting API, with no extra validation needed at the call site.

## Related

- [Timeout Budget](../infra/timeout-budget.md) — the static ceilings (`HTTP_REQUEST_TIMEOUT_MS`, `DEPENDENCY_TIMEOUT_MS`) that `Deadline` is measured against.
- [Async Context](./async-context.md) — the generic `AsyncLocalStorage` wrapper `Deadline` is propagated through.
