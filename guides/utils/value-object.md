# Value Object

Base class for domain Value Objects. A Value Object has **no identity**: it is defined entirely by its attributes, validated on construction, and compared by value.

Use it for concepts like a permission (`action` + `resource`), an address, a money amount, or a date range. If the concept needs an `id`, a lifecycle (`createdAt`, `deletedAt`), or domain events, it is an entity: use [BaseEntity](./entity.md) instead.

## Why in Utils?

Like `BaseEntity`, this is domain functionality, but it is **shared tooling** that every domain can use. It lives next to `BaseEntity` in `src/utils/domain/` and is exported from `@/utils/domain`.

## Conventions

| Rule        | Value                                                                             |
| ----------- | --------------------------------------------------------------------------------- |
| Folder      | `core/{domain}/entity/` (no separate `value-objects/` folder)                     |
| File name   | `{domain}-{subdomain}.ts`, **without** a `-value-object` suffix                   |
| Class name  | `{Domain}{Subdomain}ValueObject`                                                  |
| Schema name | `{Domain}{Subdomain}ValueObjectSchema`                                            |
| Base class  | `BaseValueObject<T>(schema)`, never `BaseEntity`                                  |
| Identity    | None: no `id`, no `ensureID()`, no timestamps, no domain events                   |
| Properties  | `declare readonly prop: Type` (see [Declaring properties](#declaring-properties)) |

Example: `RolePermissionValueObject` lives in `core/role/entity/role-permission.ts`.

## Basic Usage

```typescript
// core/role/entity/role-permission.ts
import { BaseValueObject } from '@/utils/domain'
import { InferSchema, InputValidator } from '@/utils/validator'

const Action = InputValidator.enum(['read', 'write', 'delete'])
const Resource = InputValidator.string().min(1)

export const RolePermissionValueObjectSchema = InputValidator.object({
  action: Action,
  resource: Resource
})

type RolePermission = InferSchema<typeof RolePermissionValueObjectSchema>

export class RolePermissionValueObject extends BaseValueObject<RolePermission>(RolePermissionValueObjectSchema) {
  declare readonly action: RolePermission['action']
  declare readonly resource: RolePermission['resource']

  constructor(value: RolePermission) {
    super(value) // validates against the schema and assigns the properties
    this.freeze() // makes the instance immutable
  }

  allows(action: RolePermission['action'], resource: string): boolean {
    return this.action === action && this.resource === resource
  }
}
```

The schema is passed **once**, to `BaseValueObject<T>(schema)`. The constructor only receives the value. Unlike `BaseEntity`, there is no separate `validate()` call: `super(value)` parses and assigns in one step.

## Declaring Properties

**Always use `declare readonly`, never `!`.**

```typescript
// ❌ WRONG - properties end up undefined
export class RolePermissionValueObject extends BaseValueObject<RolePermission>(RolePermissionValueObjectSchema) {
  action!: RolePermission['action']
  resource!: RolePermission['resource']
}

// ✅ CORRECT
export class RolePermissionValueObject extends BaseValueObject<RolePermission>(RolePermissionValueObjectSchema) {
  declare readonly action: RolePermission['action']
  declare readonly resource: RolePermission['resource']
}
```

Since ES2022, class fields are part of JavaScript, and SWC (used by the build and by Jest) compiles them with these standard semantics by default (`useDefineForClassFields`), regardless of `target`. So `action!: Type` emits a real class field. Class fields of a subclass are initialized **after** `super()` returns, which resets `action` to `undefined` right after `BaseValueObject` assigned it. `declare` emits no field, so the value assigned in `super()` stays.

Entities don't have this problem because they call `this.validate(entity)` **after** `super()`.

## Methods

### constructor - Validation on Construction

The constructor parses the value with the schema and assigns the result to the instance. An invalid value throws a `ZodError`, so an invalid Value Object can never exist.

```typescript
new RolePermissionValueObject({ action: 'read', resource: 'cat' }) // ✅
new RolePermissionValueObject({ action: 'fly', resource: '' }) // ❌ throws ZodError
```

Keys not in the schema are dropped, and schema transforms are applied, exactly as in `schema.parse()`.

### toData() - Plain Object

Returns a plain object by parsing the instance with the schema again.

```typescript
const permission = new RolePermissionValueObject({ action: 'read', resource: 'cat' })

permission.toData() // { action: 'read', resource: 'cat' }
```

Because `toData()` re-parses, **schema transforms run again on every call**. Keep transforms idempotent (`trim()`, `toUpperCase()` are fine; "append a prefix" is not).

### equals() - Equality by Value

Two Value Objects are equal when they are instances of the **same class** and their `toData()` results are deeply equal.

```typescript
const a = new RolePermissionValueObject({ action: 'read', resource: 'cat' })
const b = new RolePermissionValueObject({ action: 'read', resource: 'cat' })
const c = new RolePermissionValueObject({ action: 'write', resource: 'cat' })

a === b // false (different references)
a.equals(b) // true (same values)
a.equals(c) // false
a.equals(null) // false
a.equals({ action: 'read', resource: 'cat' }) // false (plain object, not the same class)
```

Use `equals()` instead of `===` whenever you compare Value Objects, for example to avoid duplicates:

```typescript
addPermission(permission: RolePermissionValueObject) {
  if (this.permissions.some((p) => p.equals(permission))) {
    return
  }
  this.permissions.push(permission)
}
```

### freeze() - Immutability

Calls `Object.freeze(this)`. Call it as the **last line of the constructor**. After that, assigning a property throws a `TypeError` in strict mode (which all ES modules and classes use).

```typescript
const permission = new RolePermissionValueObject({ action: 'read', resource: 'cat' })
permission.action = 'write' // ❌ TypeError (and a compile error, because of `readonly`)
```

`Object.freeze` is **shallow**. Nested objects and arrays inside the Value Object can still be mutated. Prefer primitives or other Value Objects as properties.

## Changing a Value Object

Value Objects are not updated. To "change" one, create a new instance:

```typescript
const read = new RolePermissionValueObject({ action: 'read', resource: 'cat' })
const write = new RolePermissionValueObject({ ...read.toData(), action: 'write' })
```

There is no `merge()` or `clone()`, since a Value Object with the same values is, by definition, the same Value Object.

## Using a Value Object Inside an Entity

The Value Object's schema is imported into the parent entity's schema, so the parent validates its whole structure in one parse. See [Entities, Sub-entities, and Value Objects](../../README.md#entities-sub-entities-and-value-objects).

```typescript
// core/role/entity/role.ts
import { RolePermissionValueObject, RolePermissionValueObjectSchema } from './role-permission'

export const RoleEntitySchema = InputValidator.object({
  id: InputValidator.uuid(),
  name: InputValidator.string(),
  permissions: InputValidator.array(RolePermissionValueObjectSchema).optional()
  // ...
})
```

Create the Value Object instances from the parsed data when the entity needs their behavior (`equals()`, `allows()`), and call `toData()` on them before persisting.

## BaseValueObject vs BaseEntity

|                      | `BaseValueObject`             | `BaseEntity`                           |
| -------------------- | ----------------------------- | -------------------------------------- |
| Identity             | None                          | `id` via `ensureID()`                  |
| Schema               | `BaseValueObject<T>(schema)`  | `super(schema)` in the constructor     |
| Validation           | Automatic in `super(value)`   | Explicit `this.validate(entity)`       |
| Equality             | `equals()` by value           | No `equals()`; compare by `id`         |
| Mutability           | Immutable with `freeze()`     | Mutable (`merge()`, `activate()`, ...) |
| Timestamps           | No                            | `createdAt`, `updatedAt`, `deletedAt`  |
| Domain events        | No                            | `addEvent()`, `releaseEvents()`, ...   |
| Property declaration | `declare readonly prop: Type` | `prop!: Type`                          |
| Class suffix         | `ValueObject`                 | `Entity`                               |
