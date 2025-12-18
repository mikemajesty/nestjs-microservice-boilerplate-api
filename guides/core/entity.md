# Entity

Entities are the **heart of the domain layer**. They represent business concepts with identity, state, and behavior. In this project, entities are also **aggregates** — they encapsulate related data and business rules.

## Location & Naming Conventions

| Convention | Pattern | Example |
|------------|---------|---------|
| **Folder** | `src/core/{domain}/entity/` | `src/core/cat/entity/` |
| **File** | `{domain}.ts` | `cat.ts` |
| **Class** | `{Domain}Entity` | `CatEntity` |
| **Schema** | `{Domain}EntitySchema` | `CatEntitySchema` |
| **Type** | `{Domain}` (inferred) | `Cat` |

## Anatomy of an Entity

```typescript
// src/core/cat/entity/cat.ts
import { BaseEntity } from '@/utils/entity'
import { Infer, InputValidator } from '@/utils/validator'

// 1️⃣ Define each field's validation rules
const ID = InputValidator.uuid()
const Name = InputValidator.string().trim().min(1).max(200)
const Breed = InputValidator.string().trim().min(1).max(200)
const Age = InputValidator.int().min(0).max(30)
const CreatedAt = InputValidator.date().nullish()
const UpdatedAt = InputValidator.date().nullish()
const DeletedAt = InputValidator.date().nullish()

// 2️⃣ Compose the schema (always: {Domain}EntitySchema)
export const CatEntitySchema = InputValidator.object({
  id: ID,
  name: Name,
  breed: Breed,
  age: Age,
  createdAt: CreatedAt,
  updatedAt: UpdatedAt,
  deletedAt: DeletedAt
})

// 3️⃣ Infer the type from schema
type Cat = Infer<typeof CatEntitySchema>

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

Each field has its own validation rules using `InputValidator` (Zod):

```typescript
const Name = InputValidator.string().trim().min(1).max(200)
const Age = InputValidator.int().min(0).max(30)
const Email = InputValidator.string().email()
const Status = InputValidator.enum(['active', 'inactive'])
```

### 2️⃣ Compose the Schema

Combine all fields into a single schema:

```typescript
export const CatEntitySchema = InputValidator.object({
  id: ID,
  name: Name,
  // ...
})
```

### 3️⃣ Infer the Type

Use Zod's `Infer` to generate TypeScript type from schema:

```typescript
type Cat = Infer<typeof CatEntitySchema>
// Result: { id: string; name: string; breed: string; age: number; ... }
```

### 4️⃣ Extend BaseEntity

The entity class extends `BaseEntity` which provides:
- `validate(entity)` — Validates and assigns all properties
- `ensureID()` — Generates ID if not provided
- `toObject()` — Converts to plain object

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
  calculateTotal(order: OrderEntity) { /* ... */ }
  canBeCancelled(order: OrderEntity) { /* ... */ }
  applyDiscount(order: OrderEntity, discount: number) { /* ... */ }
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
      throw new Error('Invalid discount percentage')
    }
    this.total = this.total * (1 - percentage / 100)
  }

  markAsShipped(): void {
    if (this.status !== 'confirmed') {
      throw new Error('Only confirmed orders can be shipped')
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
const Description = InputValidator.string().nullish()  // string | null | undefined
const DeletedAt = InputValidator.date().nullish()
```

### Enums

```typescript
const Status = InputValidator.enum(['active', 'inactive', 'pending'])

// In schema
export const UserEntitySchema = InputValidator.object({
  // ...
  status: Status
})
```

### Nested Objects

```typescript
const Address = InputValidator.object({
  street: InputValidator.string(),
  city: InputValidator.string(),
  zipCode: InputValidator.string()
})

export const UserEntitySchema = InputValidator.object({
  // ...
  address: Address
})
```

### Arrays

```typescript
const Tags = InputValidator.array(InputValidator.string())
const Items = InputValidator.array(InputValidator.object({
  productId: InputValidator.uuid(),
  quantity: InputValidator.int().min(1)
}))
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
- [Validator](../utils/validator.md) — InputValidator (Zod) documentation
