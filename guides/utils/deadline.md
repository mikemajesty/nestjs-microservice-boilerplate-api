# Deadline

`Deadline` represents how much time is left for the current inbound HTTP request before its timeout — set either by the route's `@RequestTimeout` decorator or by the fixed fallback `TimeoutBudget.HTTP_REQUEST_TIMEOUT_MS` — is reached. Outbound dependencies (HTTP calls, retries) consult it instead of always applying a static per-dependency budget, so a slow dependency can never be given more time than the inbound request actually has left.

It's propagated through the request's async call chain using [`AsyncContext`](./async-context.md), so any code reached from the request handler can read the current deadline without it being passed down as a parameter.

## Where it's created

[`RequestTimeoutInterceptor`](../../src/middlewares/interceptors/request-timeout.interceptor.ts) creates the `Deadline` for every request, from the same `finalTimeout` value it uses to abort the request with `rxjs`'s `timeout()`:

```ts
const finalTimeout = requestTimeout ?? TimeoutBudget.HTTP_REQUEST_TIMEOUT_MS
const deadline = Deadline.fromTimeout(finalTimeout)

return runWithDeadline(deadline, () => next.handle()).pipe(
  timeout(finalTimeout),
  // ...
)
```

Because `next.handle()` runs inside `runWithDeadline`, the deadline is available to everything the handler calls — controller, use case, repository, outbound HTTP client — for the lifetime of that request.

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
