# Cache Aside

`CacheAsideModule` provides a read-through cache layer on top of `ICacheAdapter`.
It implements the **cache-aside** pattern: the application remains the source-of-truth coordinator, while Redis stores a disposable copy of data that is expensive to load repeatedly.

Without it, every caller needs to repeat the same cache flow:

```ts
const cached = await cache.get(key)
if (cached) return JSON.parse(cached)

const value = await repository.findById(id)
await cache.set(key, JSON.stringify(value))
return value
```

`ICacheAsideAdapter` centralizes that flow, serialization, TTL jitter, null caching, batched reads, and best-effort invalidation.

```
Request
  │
  ▼
CacheAsideService
  │
  ├─ cache hit  ──────────────────────────────► return cached value
  │
  └─ cache miss ─► loader (database/API) ─► store in Redis ─► return value
```

It is useful when a value is read frequently but changes less often, such as products, configuration, reference data, profiles, or related records loaded in batches.

Benefits:

- reduces database or external API load on cache hits;
- keeps cache behavior consistent across callers;
- applies TTL jitter to reduce simultaneous expirations;
- caches `null` temporarily to limit repeated lookups for missing data;
- supports one `MGET` and one write transaction for multiple related keys;
- keeps cache failures from interrupting the primary business flow.

The module uses Redis through `CacheRedisModule` and exposes `ICacheAsideAdapter`.

```ts
import { ICacheAsideAdapter } from '@/infra/cache/aside'

@Injectable()
export class UserService {
  constructor(private readonly cacheAside: ICacheAsideAdapter) {}
}
```

## Options

All read methods receive these options:

```ts
{
  ttlSeconds: 300,
  nullTtlSeconds: 30, // optional; defaults to 60 seconds
  tags: [{ key: 'users', ttlSeconds: 300 }] // optional
}
```

Cached values receive a small TTL jitter. `null` is stored with an internal sentinel to prevent repeated lookups for missing data. `undefined` is never cached.

## `readThrough`

Reads one key. Calls `loader` only when the key is missing or contains invalid JSON.

```ts
const user = await this.cacheAside.readThrough(
  `user:id:${id}`,
  () => this.userRepository.findById(id),
  { ttlSeconds: 300, nullTtlSeconds: 30 }
)
```

Use it for independent values with a normal cache-aside flow. Concurrent misses for the same key are not coordinated.

## `readThroughSingleFlight`

Works like `readThrough`, but concurrent misses for the same key in the same application instance share one loader execution.

```ts
const settings = await this.cacheAside.readThroughSingleFlight(
  'settings:public',
  () => this.settingsRepository.getPublicSettings(),
  { ttlSeconds: 600 }
)
```

Use it when a loader is expensive and several local requests can miss the same key simultaneously. It is not a distributed lock: separate application replicas can still load the same key concurrently.

## `readThroughMany`

Reads multiple keys with one `MGET`. The loader receives only missing keys and must return a `Map` keyed by the full cache key. The returned array preserves the input key order; a key not returned by the loader is `null`.

```ts
const keys = roleIds.map((id) => `role:id:${id}`)

const roles = await this.cacheAside.readThroughMany(
  keys,
  async (missingKeys) => {
    const ids = missingKeys.map((key) => key.replace('role:id:', ''))
    const found = await this.roleRepository.findIn({ id: ids })

    return new Map(found.map((role) => [`role:id:${role.id}`, role]))
  },
  { ttlSeconds: 600 }
)
```

Missing values returned by the loader are written in one Redis transaction. Use it when multiple related records can be loaded in one database query.

## `invalidate`

Removes one key.

```ts
await this.cacheAside.invalidate(`user:id:${userId}`)
```

Call it after a successful database write that changes the cached representation.

## `invalidateMany`

Removes several keys in one cache operation. An empty list is a no-op.

```ts
await this.cacheAside.invalidateMany(roleIds.map((id) => `role:id:${id}`))
```

## `invalidateByTag`

Removes all keys associated with a tag. Tags are registered when values are stored with `options.tags`.

```ts
await this.cacheAside.readThrough(
  `role:id:${role.id}`,
  () => role,
  {
    ttlSeconds: 600,
    tags: [{ key: `permission:id:${permissionId}`, ttlSeconds: 600 }]
  }
)

await this.cacheAside.invalidateByTag(`permission:id:${permissionId}`)
```

The Redis Lua script removes tagged keys and its tag index atomically. Large tag sets are unlinked in bounded batches.

## Failure behavior

Cache reads, writes, and invalidations are best-effort. Failures are logged and do not interrupt the caller:

- a read failure behaves as a cache miss;
- a write failure still returns the loader result;
- invalidation failure does not fail the database flow.

The loader itself is not swallowed: its errors continue to the caller.

## Catalog example

Cache a product and its related categories with different TTLs:

```ts
const product = await this.cacheAside.readThrough(
  `product:id:${productId}`,
  () => this.productRepository.findById(productId),
  { ttlSeconds: 300, nullTtlSeconds: 30 }
)

if (!product) {
  return null
}

const categories = await this.cacheAside.readThroughMany(
  product.categoryIds.map((id) => `category:id:${id}`),
  async (missingKeys) => {
    const ids = missingKeys.map((key) => key.replace('category:id:', ''))
    const found = await this.categoryRepository.findIn({ id: ids })

    return new Map(found.map((category) => [`category:id:${category.id}`, category]))
  },
  { ttlSeconds: 600 }
)
```

When a product changes, invalidate `product:id:${productId}`. When a category changes, invalidate only its `category:id:${categoryId}` key.
