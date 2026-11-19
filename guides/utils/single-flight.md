# Single Flight

Deduplicates concurrent calls by key: while an operation for a key is running, other calls with the
same key wait for it instead of starting their own. Modeled on Go's
[`singleflight.Group`](https://pkg.go.dev/golang.org/x/sync/singleflight).

📄 Code: [`src/utils/single-flight.ts`](../../src/utils/single-flight.ts)

---

## Usage

```typescript
export class ExchangeRateService {
  private readonly singleFlight = new SingleFlight()

  getRate(currency: string): Promise<number> {
    return this.singleFlight.run({
      key: `exchange-rate:${currency}`,
      operation: () => this.http.get(`/rates/${currency}`)
    })
  }
}
```

Fifty requests asking for `USD` at the same moment trigger **one** HTTP call; all fifty get its result.

| Method | What it does |
|--------|--------------|
| `run({ key, operation })` | Runs `operation`, or joins the one already running for `key` |
| `forget(key)` | Releases `key` now: the next `run()` starts fresh; current waiters keep the old operation |

---

## `forget`: after a write

Without `forget`, a key is only released when its operation settles. A read that started **before** a
write keeps accepting new callers **after** it, and hands them the old value:

```
t=0    A: run('product:1')      → read 1 starts (takes 200ms)
t=50   price updated in the database
t=100  B: run('product:1')      → joins read 1 and receives the OLD price
t=200  read 1 settles           → A and B both get the old price
```

Call `forget` right after the write, so later callers start a fresh read:

```
t=0    A: run('product:1')      → read 1 starts
t=50   price updated + forget('product:1')
t=100  B: run('product:1')      → key is free: read 2 starts and sees the NEW price
t=200  read 1 settles           → only A gets the old price (it asked before the write)
```

```typescript
export class ProductService {
  private readonly singleFlight = new SingleFlight()

  getProduct(id: string): Promise<Product> {
    return this.singleFlight.run({
      key: `product:${id}`,
      operation: () => this.repository.findById(id)
    })
  }

  async updatePrice(id: string, price: number): Promise<void> {
    await this.repository.updatePrice(id, price)

    // Reads already running started before this write: stop new callers from joining them.
    this.singleFlight.forget(`product:${id}`)
  }
}
```

What `forget` does **not** do:

- **It does not cancel the running operation.** Callers already waiting on it still receive its result.
- **It is not cache invalidation.** Single flight keeps no results; `forget` only frees the key.
  If a cache sits in front of the read, invalidate the cache too.
- **The old operation does not disturb the new one.** When read 1 settles, it only removes its own
  entry, so read 2 keeps owning the key.

Call it **after** the write succeeds. Calling it before leaves a window where a new read starts, still
sees the old data, and becomes the one everyone joins.

## Rules

- **Not a cache.** When the operation settles, the key is released and the next call runs again.
  To keep results after they are ready, put a cache in front of it.
- **Shared outcome.** Everyone waiting on a key gets the same value or the same rejection.
  A failure is not remembered: the next call retries.
- **The key identifies the result.** Anything the operation depends on (ids, options, filters) must be
  in the key, or different requests will receive each other's results.
- **One instance per owner.** Each instance has its own map, so two features never share results by
  accident. Share the instance only when you want calls to be deduplicated together.
- **Process-local.** With N instances of the application, up to N operations run at once. Deduplicating
  across instances needs a distributed lock.
- **No timeout.** A stuck operation keeps all its waiters stuck. Bound it inside the operation.

## Cautions

- **Never share results across users unless the key says so.** If the operation depends on who is
  asking (tenant, user, permissions), that must be in the key. Otherwise one user receives data loaded
  for another: a security bug, not just a wrong value.
- **Treat the result as read-only.** Every waiter receives the **same object reference**. If one caller
  mutates it, the others see the change. Return immutable data or copy it before changing.
- **One failure fails everyone at once.** A slow dependency that times out rejects all waiters together.
  That is usually what you want (one failed call instead of fifty), but expect error spikes in groups.
- **A caller giving up does not cancel the work.** If one waiter's request is aborted, the operation keeps
  running for the others.
- **Writes can make an in-flight read stale.** Call `forget(key)` right after the write; see
  [`forget`: after a write](#forget-after-a-write).

## When not to use it

- **Writes or side effects** (create an order, send an email): a second caller would silently ride on
  the first one's effect instead of performing its own.
- **Results that must be kept** after they are ready: that is caching or memoization.
- **Cheap operations.** If the operation costs less than the coordination, deduplicating adds nothing.

## Differences from Go

| Go `singleflight.Group` | `SingleFlight` | Why |
|-------------------------|----------------|-----|
| `Do(key, fn)` returns `(v, err, shared)` | `run()` returns a `Promise` | Promises already carry value or error; `shared` had no use here |
| `DoChan` | — | A `Promise` is already the async channel |
| `Forget(key)` | `forget(key)` | Same semantics |
| Panic in `fn` is re-panicked in every caller | A synchronous throw becomes a rejection for every caller | JS equivalent |
