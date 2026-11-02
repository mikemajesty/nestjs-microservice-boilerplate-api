# Async Context

`AsyncContext<T>` is a thin, typed wrapper around Node's `AsyncLocalStorage`. It propagates a value across an asynchronous call chain — a request handler and everything it `await`s — without threading that value through every function signature in between.

## Why

Passing cross-cutting data (a deadline, the current trace id, the caller's locale) as an explicit parameter means touching every layer that sits between where the value is produced (an interceptor) and where it's consumed (deep inside a repository or HTTP client). `AsyncContext` avoids that: a value is attached once, at the top of the call chain, and any code running inside that chain — including code reached through `await`, `Promise.then`, or timers — can read it back, with no risk of leaking across concurrent requests.

## Usage

Each cross-cutting concern owns its own `AsyncContext<T>` instance and exposes a small, typed facade over it — consumers never interact with `AsyncContext` directly.

```ts
import { AsyncContext } from '@/utils/async-context'

type RequestDeadline = { expiresAt: number }

const deadlineContext = new AsyncContext<RequestDeadline>()

export const runWithDeadline = <T>(deadline: RequestDeadline, callback: () => T): T => {
  return deadlineContext.run(deadline, callback)
}

export const getCurrentDeadline = (): RequestDeadline | undefined => {
  return deadlineContext.getCurrent()
}
```

```ts
// Somewhere at the edge (an interceptor), attach the value for the whole request:
runWithDeadline(deadline, () => next.handle())

// Anywhere deeper in that same call chain, read it back without any parameter:
const deadline = getCurrentDeadline()
```

## Existing consumers

- [`Deadline`](./deadline.md) — propagates the remaining time budget of the current inbound HTTP request.
- [`InputValidator`](./validator.md) — propagates the current request's locale for translated validation messages (via its own `AsyncLocalStorage`-based storage, predating this wrapper).

## When not to use it

`AsyncContext` is for values that are implicit and cross-cutting (every layer may need to read them, but very few actually produce them). If a value is only needed by the function directly calling you, pass it as a regular parameter instead — it's simpler to read, test, and type-check.
