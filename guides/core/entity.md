# Entity

Entities are the **heart of the domain layer**. They represent business concepts with identity, state, and behavior. In this project, entities are also **aggregates** — they encapsulate related data and business rules.

## Location & Naming Conventions

| Convention | Pattern                     | Example                |
| ---------- | --------------------------- | ---------------------- |
| **Folder** | `src/core/{domain}/entity/` | `src/core/cat/entity/` |
| **File**   | `{domain}.ts`               | `cat.ts`               |
| **Class**  | `{Domain}Entity`            | `CatEntity`            |
| **Schema** | `{Domain}EntitySchema`      | `CatEntitySchema`      |
| **Type**   | `{Domain}` (inferred)       | `Cat`                  |

## Anatomy of an Entity

```typescript
// src/core/cat/entity/cat.ts
import { BaseEntity } from '@/utils/domain'
import { InferSchema, Schema } from '@/utils/schema'

// 1️⃣ Define each field's validation rules
const ID = Schema.uuid()
const Name = Schema.string().trim().min(1).max(200)
const Breed = Schema.string().trim().min(1).max(200)
const Age = Schema.int().min(0).max(30)
const CreatedAt = Schema.date().nullish()
const UpdatedAt = Schema.date().nullish()
const DeletedAt = Schema.date().nullish()

// 2️⃣ Compose the schema (always: {Domain}EntitySchema)
export const CatEntitySchema = Schema.object({
  id: ID,
  name: Name,
  breed: Breed,
  age: Age,
  createdAt: CreatedAt,
  updatedAt: UpdatedAt,
  deletedAt: DeletedAt
})

// 3️⃣ InferSchema the type from schema
type Cat = InferSchema<typeof CatEntitySchema>

// 4️⃣ Create the entity class (always: {Domain}Entity)
export class CatEntity extends BaseEntity<CatEntity>() {
  // 5️⃣ Properties use inferred type
  name!: Cat['name']
  breed!: Cat['breed']
  age!: Cat['age']

  // 6️⃣ Constructor receives the inferred type
  constructor(entity: Cat) {
    super(CatEntitySchema)
    this.validate(entity)
    this.ensureID()
  }
}
```

## Step by Step

### 1️⃣ Define Field Validators

Each field has its own validation rules using `Schema` (Zod):

```typescript
const Name = Schema.string().trim().min(1).max(200)
const Age = Schema.int().min(0).max(30)
const Email = Schema.string().email()
const Status = Schema.enum(['active', 'inactive'])
```

### 2️⃣ Compose the Schema

Combine all fields into a single schema:

```typescript
export const CatEntitySchema = Schema.object({
  id: ID,
  name: Name
  // ...
})
```

### 3️⃣ Infer the Type

Use Zod's `InferSchema` to generate TypeScript type from schema:

```typescript
type Cat = InferSchema<typeof CatEntitySchema>
// Result: { id: string; name: string; breed: string; age: number; ... }
```

### 4️⃣ Extend BaseEntity

The entity class extends `BaseEntity` which provides:

- `validate(entity)` — Validates and assigns all properties
- `ensureID()` — Generates ID if not provided
- `toData()` — Converts to plain object

See [Entity Utils](../utils/entity.md) for full BaseEntity documentation.

### 5️⃣ Type Properties with Inference

Instead of duplicating types, reference from the inferred type:

```typescript
// ✅ Good - Single source of truth
name!: Cat['name']

// ❌ Bad - Duplicated type
name!: string
```

This ensures properties always match the schema definition.

### 6️⃣ Constructor Pattern

```typescript
constructor(entity: Cat) {
  super(CatEntitySchema)    // Pass schema to BaseEntity
  this.validate(entity)      // Validate and assign properties
  this.ensureID()            // Generate ID if missing
}
```

---

## Entities Are NOT Just DTOs

> ⚠️ **Important:** Entities should contain **business logic**, not just data.

### ❌ Anemic Entity (Anti-pattern)

```typescript
// Just a data container - no behavior
export class OrderEntity extends BaseEntity<OrderEntity>() {
  items!: Order['items']
  total!: Order['total']
  status!: Order['status']

  constructor(entity: Order) {
    super(OrderEntitySchema)
    this.validate(entity)
  }
}

// Business logic scattered in use cases
class OrderService {
  calculateTotal(order: OrderEntity) {
    /* ... */
  }
  canBeCancelled(order: OrderEntity) {
    /* ... */
  }
  applyDiscount(order: OrderEntity, discount: number) {
    /* ... */
  }
}
```

### ✅ Rich Entity (Best Practice)

```typescript
export class OrderEntity extends BaseEntity<OrderEntity>() {
  items!: Order['items']
  total!: Order['total']
  status!: Order['status']

  constructor(entity: Order) {
    super(OrderEntitySchema)
    this.validate(entity)
  }

  // Business logic INSIDE the entity
  calculateTotal(): number {
    return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  canBeCancelled(): boolean {
    return this.status === 'pending' || this.status === 'confirmed'
  }

  applyDiscount(percentage: number): void {
    if (percentage < 0 || percentage > 100) {
      throw new ApiBadRequestException('invalidDiscountPercentage')
    }
    this.total = this.total * (1 - percentage / 100)
  }

  markAsShipped(): void {
    if (this.status !== 'confirmed') {
      throw new ApiConflictException('onlyConfirmedOrdersCanBeShipped')
    }
    this.status = 'shipped'
  }
}
```

### When to Add Business Logic

Add methods to your entity when the logic:

- **Relates to entity state** — Calculations, validations, state transitions
- **Is reusable** — Used in multiple use cases
- **Encapsulates rules** — Business invariants that should always be enforced

---

## Common Patterns

### Optional Fields

```typescript
const Description = Schema.string().nullish() // string | null | undefined
const DeletedAt = Schema.date().nullish()
```

### Enums

```typescript
const Status = Schema.enum(['active', 'inactive', 'pending'])

// In schema
export const UserEntitySchema = Schema.object({
  // ...
  status: Status
})
```

### Nested Objects

```typescript
const Address = Schema.object({
  street: Schema.string(),
  city: Schema.string(),
  zipCode: Schema.string()
})

export const UserEntitySchema = Schema.object({
  // ...
  address: Address
})
```

### Arrays

```typescript
const Tags = Schema.array(Schema.string())
const Items = Schema.array(
  Schema.object({
    productId: Schema.uuid(),
    quantity: Schema.int().min(1)
  })
)
```

---

## Scaffold

Use the scaffold to generate entities with correct structure:

```bash
npm run scaffold
```

Select **CORE**:

```
Selecting template...
( ) POSTGRES:CRUD
( ) MONGO:CRUD
( ) LIB
( ) INFRA
( ) MODULE
(x) CORE
```

---

## Related Links

- [Entity Utils](../utils/entity.md) — BaseEntity class documentation
- [Validator](../utils/validator.md) — Schema (Zod) documentation
