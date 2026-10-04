# Namespaces

`Namespaces` centralizes the creation of stable, structured identifiers. A namespace is a string prefix that gives an identifier a clear scope:

```text
user:id:42
session:id:42
notification:id:42
```

The same raw ID can exist in different domains without ambiguity. Instead of scattering string templates throughout the codebase, callers use a named builder.

```ts
import { Namespaces } from '@/utils/namespaces'

const key = Namespaces.userById(' 42 ')
// "user:id:42"
```

The builders trim their input, which prevents logically identical identifiers from being stored with accidental whitespace.

## Why it is useful

Namespaces are not limited to cache keys. Any external or cross-boundary identifier benefits from a stable convention:

- cache keys;
- distributed locks;
- idempotency keys;
- event topics or queue routing keys;
- rate-limit buckets;
- metrics dimensions;
- object-storage paths.

For example, a payment process may use the same business ID in multiple systems:

```ts
const lockKey = `payment:lock:${paymentId}`
const eventTopic = `payment:event:${paymentId}`
const idempotencyKey = `payment:idempotency:${paymentId}`
```

Using named namespace builders makes these boundaries searchable, consistent, and resistant to accidental collisions.

## `NamespacesKeys`

`NamespacesKeys` contains the prefix only:

```ts
export const NamespacesKeys = {
  userById: 'user:id:'
}
```

Use a prefix when code needs to inspect or reverse a complete identifier:

```ts
const key = 'user:id:42'
const userId = key.replace(NamespacesKeys.userById, '')
// "42"
```

This is useful for batch loaders, queue consumers, or cache scans that receive full keys and need to recover the resource ID. It avoids duplicating `'user:id:'` outside the central definition.

## `Namespaces`

`Namespaces` builds a complete identifier from a domain value:

```ts
export const Namespaces = {
  userById: (id: string) => `${NamespacesKeys.userById}${id.trim()}`
}
```

Use builders for normal reads, writes, invalidations, and publishing:

```ts
const userKey = Namespaces.userById(userId)
```

## Why keep keys and builders separate

The two exports serve different directions:

| Export | Direction | Typical use |
| --- | --- | --- |
| `Namespaces` | domain value → complete identifier | create/read/delete a key |
| `NamespacesKeys` | complete identifier → domain value | parse a received key or match a prefix |

Keeping both in one place prevents two common problems:

1. hard-coded prefixes drift when a naming convention changes;
2. callers incorrectly reconstruct an ID with string splitting or duplicated templates.

When adding a namespace, add the prefix to `NamespacesKeys` first, then add a builder in `Namespaces` that uses it.

