# ObjectUtils

Small, reusable helpers for common object operations. Use these when handling optional
or loosely shaped data, selecting a typed property name, or copying object values.

## `nameOf` — keep property names in sync

Use `nameOf` when a property name is needed as a string but should still be checked
against a type by TypeScript. This is useful for configuration keys, response fields,
or other strings that would otherwise silently become stale after a rename.

```typescript
interface AppConfig {
  ENV: string
}

const envKey = ObjectUtils.nameOf<AppConfig>('ENV')
```

For static class properties, provide the static side with `typeof`:

```typescript
const timeoutKey = ObjectUtils.nameOf<typeof TimeoutBudget>('HTTP_REQUEST_TIMEOUT_MS')
```

TypeScript types do not exist at runtime, so the helper returns the supplied string; its
benefit is compile-time key checking.

## `reach` — read optional nested data

Use `reach` when reading a deeply nested value that may be missing at the root or at
any intermediate level. It centralizes nullish-path handling, keeping call sites concise
and avoiding repeated optional-chain branches (and their duplicated branch-coverage
cases) throughout the application.

```typescript
const upstreamMessage = ObjectUtils.reach(error, (e) => e.response.data.message, error.message)
```

The selector captures a property path through a `Proxy`; keep it to a direct chain of
property accesses. Avoid conditions, method calls, arithmetic, and computed expressions.
Test the helper's nullish-path behavior centrally, but still test each caller's meaningful
business behavior and fallback result.

## `firstDefined` — select a non-nullish value

Use this when choosing the first available value from fallback candidates. Unlike `||`,
it preserves valid falsy values such as `0`, `false`, and `''`.

```typescript
const status = ObjectUtils.firstDefined(response.status, error.status, 500)
```

## `clone` — deep-copy structured data

Use `clone` when a deep copy is required for data supported by the platform's
`structuredClone` algorithm.

```typescript
const exceptionParameters = ObjectUtils.clone({ ...metadata, cause: undefined })
```

Functions and other unsupported values cause `structuredClone` to throw, and custom
class prototypes are not preserved. Do not use it as a general-purpose clone for
arbitrary class instances.

## `isPlainObject` — distinguish object records

Use this guard when code should operate only on object literals or null-prototype records,
not arrays, dates, or class instances.

```typescript
if (ObjectUtils.isPlainObject(value)) {
  // value is Record<string, unknown>
}
```

## `mergeShallow` — apply shallow defaults or overrides

Use this to copy enumerable own properties into an existing target. Sources are applied
in order, so later values override earlier ones. This mutates the target and skips
prototype-sensitive keys; use it only when mutation is intended.

```typescript
const options = ObjectUtils.mergeShallow(defaults, overrides)
```

## Related

- [ObjectUtils source](../../src/utils/object.ts)
- [TypeScript `structuredClone`](https://developer.mozilla.org/docs/Web/API/Window/structuredClone)
