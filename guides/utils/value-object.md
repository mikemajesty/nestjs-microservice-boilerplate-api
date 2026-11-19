# Value Object

Base class for domain Value Objects. A Value Object has **no identity**: it is defined entirely by its attributes, validated on construction, and compared by value.

Use it for concepts like a permission (`action` + `resource`), an address, a money amount, or a date range. If the concept needs an `id`, a lifecycle (`createdAt`, `deletedAt`), or domain events, it is an entity: use [BaseEntity](./entity.md) instead.

## When to Create a Value Object

**In this project, a Value Object exists for behavior, not for validation.**

The Zod schema already centralizes validation and normalization. It is reusable (`EntitySchema.shape.field`) and gives you the type through `InferSchema`. So a Value Object that only validates duplicates what the schema already does, and adds a class, an instance, and a conversion for nothing. That is an **anemic Value Object**, and we avoid it for the same reason we avoid anemic entities.

| The value needs...                                                              | Use                                           |
| ------------------------------------------------------------------------------- | --------------------------------------------- |
| Only validation and normalization                                               | Zod schema in the entity + `InferSchema`      |
| The same validation in another entity or use case                               | Reuse the schema (`EntitySchema.shape.field`) |
| Its own behavior (format, compare, calculate, combine)                          | Value Object                                  |
| Several fields that only make sense together, with a rule involving all of them | Value Object with several fields              |

```typescript
// ❌ Anemic Value Object: only validation, the schema already does this
export class PermissionNameValueObject extends BaseValueObject<PermissionName>(PermissionNameValueObjectSchema) {
  declare readonly value: PermissionName['value']
}

// ✅ Keep it in the entity schema, and reuse the schema where needed
const Name = Schema.string()
  .transform((value) => value.trim().replace(/ /g, '_').toLowerCase())
  .refine((val) => val.includes(':'), { message: "permission must contains ':'" })

export const RoleAddPermissionSchema = Schema.object({
  permissions: Schema.array(PermissionEntitySchema.shape.name)
})

// ✅ Value Object: the value has behavior of its own
export class OrderAmountValueObject extends BaseValueObject<OrderAmount>(OrderAmountValueObjectSchema) {
  declare readonly amount: OrderAmount['amount']
  declare readonly currency: OrderAmount['currency']

  constructor(value: OrderAmount) {
    super(value)
    this.freeze()
  }

  add(other: OrderAmountValueObject): OrderAmountValueObject {
    if (this.currency !== other.currency) {
      throw new ApiUnprocessableEntityException('currencyMismatch')
    }
    return new OrderAmountValueObject({ amount: this.amount + other.amount, currency: this.currency })
  }
}
```

### Example: The User's Address

The same concept can be a schema or a Value Object. What decides is whether it has behavior.

**Step 1: only validation → schema.** The `User` aggregate has an address, and all you need is to validate it. The schema solves it, with no Value Object:

```typescript
// core/user/entity/user.ts
const Address = Schema.object({
  street: Schema.string().trim().min(1),
  number: Schema.string().trim().min(1),
  city: Schema.string().trim().min(1),
  zipCode: Schema.string().regex(/^\d{5}-?\d{3}$/)
})

export const UserEntitySchema = Schema.object({
  // ...
  address: Address.optional()
})
```

**Step 2: the address gains behavior.** Now you need to format the address as a single line. The tempting place is the aggregate:

```typescript
// ❌ Address behavior inside the User aggregate
export class UserEntity extends BaseEntity<UserEntity>() {
  formatAddress(): string {
    const { street, number, city, zipCode } = this.address
    return `${street}, ${number} - ${city}, ${zipCode}`
  }
}
```

This works, but it has two problems:

1. **Coupling.** To format an address, you need a complete `UserEntity`. The address is a concept of its own, but it is stuck to an owner.
2. **No reuse.** If an `Order` gets a shipping address, you either duplicate `formatAddress()` in `OrderEntity` or build a `UserEntity` just to format it.

**Signal:** `formatAddress()` reads only the address fields and nothing else from `User`. A method in the aggregate that only uses one field, or one group of fields, is usually a Value Object waiting to be extracted.

**Step 3: extract the Value Object.** The behavior moves to the concept it belongs to:

```typescript
// ✅ core/user/entity/user-address.ts
export const UserAddressValueObjectSchema = Schema.object({
  street: Schema.string().trim().min(1),
  number: Schema.string().trim().min(1),
  city: Schema.string().trim().min(1),
  zipCode: Schema.string().regex(/^\d{5}-?\d{3}$/)
})

type UserAddress = InferSchema<typeof UserAddressValueObjectSchema>

export class UserAddressValueObject extends BaseValueObject<UserAddress>(UserAddressValueObjectSchema) {
  declare readonly street: UserAddress['street']
  declare readonly number: UserAddress['number']
  declare readonly city: UserAddress['city']
  declare readonly zipCode: UserAddress['zipCode']

  constructor(value: UserAddress) {
    super(value)
    this.freeze()
  }

  format(): string {
    return `${this.street}, ${this.number} - ${this.city}, ${this.zipCode}`
  }
}

// core/user/entity/user.ts: the schema of the Value Object is reused in the entity schema
export const UserEntitySchema = Schema.object({
  // ...
  address: UserAddressValueObjectSchema.optional()
})
```

Now `format()` works with only an address, can be tested without a `User`, and `OrderEntity` can reuse `UserAddressValueObjectSchema` and `UserAddressValueObject` instead of duplicating the logic.

| Situation                                      | Where it goes                                 |
| ---------------------------------------------- | --------------------------------------------- |
| Address only needs validation                  | `Address` schema inside `user.ts`             |
| Address needs `format()` (or any other action) | `UserAddressValueObject` in `user-address.ts` |
| `user.formatAddress()` already exists          | Extract it into the Value Object              |

**Ask yourself:** "Does this value have actions of its own?" If not, a Zod schema with `InferSchema` is enough.

`equals()` and `freeze()` are how a Value Object works, not reasons to create one.

> **A deliberate decision, not a universal DDD rule.** Classical DDD (the _Whole Value_ pattern) accepts Value Objects without behavior, because in codebases without schemas the Value Object is the natural place to centralize validation and to name the concept. Here the Zod schema already plays that role, so we follow the [Pragmatic Principle](../../README.md#the-pragmatic-principle): the common case (validation only) stays in the schema, and the Value Object is the exception that needs a concrete reason. The signal to revisit it is tracked in [When Exceptions Become the Rule](../../README.md#when-exceptions-become-the-rule).

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
import { InferSchema, Schema } from '@/utils/schema'

const Action = Schema.enum(['read', 'write', 'delete'])
const Resource = Schema.string().min(1)

export const RolePermissionValueObjectSchema = Schema.object({
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

export const RoleEntitySchema = Schema.object({
  id: Schema.uuid(),
  name: Schema.string(),
  permissions: Schema.array(RolePermissionValueObjectSchema).optional()
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
