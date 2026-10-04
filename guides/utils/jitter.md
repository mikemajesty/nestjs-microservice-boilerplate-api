# Jitter

`JitterUtils` applies controlled random variation to a numeric value. It is useful when many operations would otherwise happen at exactly the same time.

The main use case is a cache TTL. If many keys expire after the same fixed duration, they can all miss together and cause a burst of database or API calls. This is known as a cache stampede. Jitter spreads those expirations over a small time window.

## `apply`

Applies a percentage variation around a base value.

```ts
import { JitterUtils } from '@/utils/jitter'

const delay = JitterUtils.apply({
  base: 1_000,
  percentage: 0.1
})

// Integer between 900 and 1,100
```

The default percentage is `0.1` (10%).

```ts
const value = JitterUtils.apply({
  base: 100,
  percentage: 0.2,
  options: {
    min: 90,
    max: 110,
    integer: true
  }
})
```

`min` and `max` clamp the final value. `integer` rounds down to an integer.

When `base` is zero or negative, `apply` returns it unchanged.

## `applyTtl`

Applies TTL-specific jitter. It always returns an integer greater than or equal to one.

```ts
const ttlSeconds = JitterUtils.applyTtl(300)

// Integer close to 300 seconds, never less than 1
```

Use it for TTLs that will be passed to cache, lock, retry, or scheduling APIs:

```ts
const ttlSeconds = JitterUtils.applyTtl(600)
await cache.set(key, value, { EX: ttlSeconds })
```

For deterministic tests, mock or inject the randomness boundary rather than asserting an exact jittered value.

