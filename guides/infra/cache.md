# Cache

## Problem

Caching in applications requires:
- Choosing between Redis (distributed) or in-memory (local) cache
- Changing cache provider means rewriting all code that uses it
- Different APIs for each cache library
- No abstraction to swap providers easily

```typescript
// ❌ Tightly coupled to Redis
import { createClient } from 'redis'

const client = createClient()
await client.connect()

// If you need to switch to in-memory for tests or dev... rewrite everything
await client.set('key', 'value')
await client.hSet('hash', 'field', 'value')
```

---

## Solution

The **ICacheAdapter** provides a single interface for both cache providers:
- **RedisService** — Distributed cache (production)
- **MemoryCacheService** — In-memory cache (development/tests)

Same code works with both. Just swap the module.

```
src/infra/cache/
├── adapter.ts      # ICacheAdapter interface
├── tags.ts         # tags used to invalidate cached authorization data
├── memory/
│   └── service.ts  # node-cache implementation
└── redis/
    ├── module.ts   # RedisConnectionModule (connection) + RedisCacheModule (adapter)
    └── service.ts  # implementation on top of @nestjs-redisx/core
```

The Redis connection is opened by `RedisConnectionModule`, imported once by
`InfraModule`. Feature modules import only `RedisCacheModule`, so a test that
stubs `ICacheAdapter` never opens a socket.

---

## Interface

```typescript
export abstract class ICacheAdapter<T = any> {
  client!: T

  abstract connect(): Promise<T> | T
  abstract ping(): Promise<string>

  // Basic operations
  abstract set<TKey, TValue, TConf>(key: TKey, value: TValue, config?: TConf): Promise<void> | void
  abstract get<TKey>(key: TKey): Promise<string | null> | string
  abstract del<TKey>(key: TKey): Promise<void> | boolean
  abstract has(key?: string | number): boolean

  // Multiple keys
  abstract mSet<TSet>(model?: TSet[]): boolean
  abstract mGet(key?: string[]): unknown | null
  abstract setMulti(redisList?: RedisCacheKeyValue[]): Promise<void>

  // TTL
  abstract pExpire<TKey>(key: TKey, milliseconds: number): Promise<void> | boolean

  // Hash operations (Redis-specific, but in interface)
  abstract hGet<TKey, TField>(key?: TKey, field?: TField): Promise<unknown> | void
  abstract hSet<TKey, TField, TValue>(key?: TKey, field?: TField, value?: TValue): Promise<number> | void
  abstract hGetAll<TKey>(key: TKey): Promise<unknown> | void
}
```

---

## Usage Examples

### Basic Operations

```typescript
import { ICacheAdapter } from '@/infra/cache'

@Injectable()
export class MyService {
  constructor(private readonly cache: ICacheAdapter) {}

  async example() {
    // Set value
    await this.cache.set('user:123', JSON.stringify({ name: 'John' }))

    // Set with TTL (Redis)
    await this.cache.set('session:abc', 'token', { EX: 3600 }) // 1 hour

    // Get value
    const user = await this.cache.get('user:123')

    // Check if exists
    const exists = this.cache.has('user:123')

    // Delete
    await this.cache.del('user:123')
  }
}
```

### Multiple Keys

```typescript
// Set multiple at once
this.cache.mSet([
  { key: 'key1', val: 'value1' },
  { key: 'key2', val: 'value2' }
])

// Get multiple at once
const values = this.cache.mGet(['key1', 'key2'])
```

### TTL (Time To Live)

```typescript
// Set expiration in milliseconds
await this.cache.pExpire('session:abc', 60000) // 60 seconds
```

### Hash Operations (Redis-specific)

```typescript
// Store structured data
await this.cache.hSet('user:123', 'name', 'John')
await this.cache.hSet('user:123', 'email', 'john@example.com')

// Get single field
const name = await this.cache.hGet('user:123', 'name')

// Get all fields
const user = await this.cache.hGetAll('user:123')
// { name: 'John', email: 'john@example.com' }
```

---

## Provider Differences

| Method | Redis | Memory (node-cache) |
|--------|-------|---------------------|
| `set` | ✅ | ✅ |
| `get` | ✅ | ✅ |
| `del` | ✅ | ✅ |
| `has` | ✅ | ✅ |
| `mSet` | ✅ | ✅ |
| `mGet` | ✅ | ✅ |
| `pExpire` | ✅ | ✅ |
| `hGet` | ✅ | ❌ |
| `hSet` | ✅ | ❌ |
| `hGetAll` | ✅ | ❌ |
| `setMulti` | ✅ | ❌ |
| `ping` | ✅ | ❌ |

> **Note:** Hash operations (`hGet`, `hSet`, `hGetAll`) are Redis-specific. MemoryCacheService doesn't implement them.

---

## Real Usage: Logout

The logout feature uses cache to store invalidated tokens:

```typescript
// src/modules/logout/module.ts
@Module({
  imports: [RedisCacheModule],
  providers: [
    {
      provide: ILogoutAdapter,
      useFactory: (cache: ICacheAdapter, secrets: ISecretsAdapter) => {
        return new LogoutUsecase(cache, secrets)
      },
      inject: [ICacheAdapter, ISecretsAdapter]
    }
  ]
})
export class LogoutModule {}
```

```typescript
// In the use case
export class LogoutUsecase {
  constructor(
    private readonly cache: ICacheAdapter,
    private readonly secrets: ISecretsAdapter
  ) {}

  async execute(token: string) {
    // Store invalidated token until it expires
    await this.cache.set(`blacklist:${token}`, 'invalid', { 
      EX: this.secrets.JWT.EXPIRATION 
    })
  }
}
```

---

## Swapping Providers

### Production (Redis)

```typescript
// Import RedisCacheModule
@Module({
  imports: [RedisCacheModule],
  // ...
})
```

### Development/Tests (Memory)

```typescript
// Import MemoryCacheModule
@Module({
  imports: [MemoryCacheModule],
  // ...
})
```

The code using `ICacheAdapter` doesn't change — only the imported module.

---

## Connection

### Redis

```typescript
// Automatic on module init
const redis = new RedisService(logger, client)
await redis.connect()
// 🎯 redis connected!
```

The client comes from `@nestjs-redisx/core`, configured from `REDIS_URL` and
kept on the `node-redis` driver so the existing OpenTelemetry Redis
instrumentation keeps producing spans.

---

## Cached Permissions

`AuthorizationRoleGuard` used to load the user with roles and permissions from
the database on every permission-protected request. That lookup is now cached
by permission name only, so no credential reaches Redis:

```typescript
@Cached({
  key: 'user:permissions:{0}',
  ttl: USER_PERMISSIONS_CACHE_TTL_IN_SECONDS,
  tags: [userCacheTag('{0}'), USER_PERMISSIONS_CACHE_TAG]
})
private async findUserPermissions(userId: string): Promise<string[] | null>
```

Writes drop the entries instead of waiting for expiration:

| Use case | Invalidates |
|---|---|
| `user-update`, `user-delete` | `user:<id>` |
| `role-update`, `role-delete`, `role-add-permission`, `role-delete-permission` | `user-permissions` |
| `permission-update`, `permission-delete` | `user-permissions` |

The TTL in `src/infra/cache/tags.ts` is only a safety net for a path that
forgets to invalidate.

### Memory

```typescript
// Automatic on module init
const memory = new MemoryCacheService(logger)
memory.connect({ stdTTL: 3600, checkperiod: 3600 })
// 🎯 cacheMemory connected!
```

---

## Health Check

Redis has a `ping()` method for health checks:

```typescript
const status = await this.cache.ping()
// 'PONG' if healthy, 'DOWN' if not
```

Used in the health module to check Redis connectivity.

---

## Related Links

- [Repository](./repository.md) — Same adapter pattern for databases
- [Secrets](./secrets.md) — Redis connection configuration
