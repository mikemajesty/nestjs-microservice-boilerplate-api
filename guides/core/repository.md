# Repository Interface

The repository interface in `core/` defines the **contract** for data access operations specific to a domain. It's an **abstraction** — the actual implementation lives in `modules/`.

## Location & Naming Conventions

| Convention | Pattern | Example |
|------------|---------|---------|
| **Folder** | `src/core/{domain}/repository/` | `src/core/cat/repository/` |
| **File** | `{domain}.ts` | `cat.ts` |
| **Interface** | `I{Domain}Repository` | `ICatRepository` |

## Anatomy of a Repository Interface

```typescript
// src/core/cat/repository/cat.ts
import { IRepository } from '@/infra/repository'

import { CatEntity } from '../entity/cat'
import { CatListInput, CatListOutput } from '../use-cases/cat-list'

export abstract class ICatRepository extends IRepository<CatEntity> {
  abstract paginate(input: CatListInput): Promise<CatListOutput>
}
```

## How It Works

```
┌─────────────────────────────────────────────────────────────────────┐
│                        REPOSITORY PATTERN                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   src/core/cat/repository/cat.ts                                   │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │  ICatRepository (Abstract)                                   │  │
│   │  ├── extends IRepository<CatEntity>  ← Generic methods      │  │
│   │  └── abstract paginate(...)          ← Domain-specific      │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                              │                                      │
│                              │ implements                           │
│                              ▼                                      │
│   src/modules/cat/repository.ts                                    │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │  CatRepository (Concrete)                                    │  │
│   │  ├── extends MongoRepository<CatDocument>                   │  │
│   │  └── implements ICatRepository                              │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Key Concepts

### 1️⃣ Extends IRepository<Entity>

By extending `IRepository<CatEntity>`, you automatically inherit **20+ generic methods**:

- `create()`, `findById()`, `findOne()`, `findAll()`
- `updateOne()`, `updateMany()`
- `deleteOne()`, `deleteMany()`, `softDelete()`
- And many more...

See [Repository (Infra)](../infra/repository.md) for the complete list.

### 2️⃣ Domain-Specific Methods

Add only the methods that **don't exist** in the generic repository:

```typescript
export abstract class ICatRepository extends IRepository<CatEntity> {
  // Pagination with search/sort - not in generic repo
  abstract paginate(input: CatListInput): Promise<CatListOutput>
}
```

```typescript
export abstract class IOrderRepository extends IRepository<OrderEntity> {
  // Domain-specific queries
  abstract findByCustomer(customerId: string): Promise<OrderEntity[]>
  abstract findPendingOrders(): Promise<OrderEntity[]>
  abstract calculateTotalSales(startDate: Date, endDate: Date): Promise<number>
}
```

### 3️⃣ It's an Abstraction

The interface in `core/` **does not know** about:
- MongoDB or PostgreSQL
- Mongoose or TypeORM
- Any database implementation details

This keeps your business logic **database-agnostic**.

## Why This Pattern?

| Benefit | Description |
|---------|-------------|
| **Dependency Inversion** | Core depends on abstraction, not implementation |
| **Testability** | Easy to mock in unit tests |
| **Flexibility** | Swap database without changing business logic |
| **Clean Architecture** | Core layer has no external dependencies |

## Example: More Complex Repository

```typescript
// src/core/order/repository/order.ts
import { IRepository } from '@/infra/repository'

import { OrderEntity } from '../entity/order'
import { OrderListInput, OrderListOutput } from '../use-cases/order-list'

export abstract class IOrderRepository extends IRepository<OrderEntity> {
  // Pagination
  abstract paginate(input: OrderListInput): Promise<OrderListOutput>
  
  // Domain-specific queries
  abstract findByCustomerId(customerId: string): Promise<OrderEntity[]>
  abstract findByStatus(status: string): Promise<OrderEntity[]>
  abstract findPendingPayments(): Promise<OrderEntity[]>
  
  // Aggregations
  abstract countByStatus(status: string): Promise<number>
  abstract sumTotalByCustomer(customerId: string): Promise<number>
}
```

## Implementation

The concrete implementation lives in `modules/`:

```typescript
// src/modules/cat/repository.ts
@Injectable()
export class CatRepository extends MongoRepository<CatDocument> implements ICatRepository {
  // ... implementation
}
```

See [Repository (Modules)](../modules/repository.md) for implementation details.

---

## Related Links

- [Repository (Infra)](../infra/repository.md) — IRepository generic methods
- [Repository (Modules)](../modules/repository.md) — Concrete implementation
- [Entity](./entity.md) — Domain entity that repository manages
