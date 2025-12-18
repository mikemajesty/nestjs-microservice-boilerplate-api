# Core Layer

The **Core Layer** contains the heart of the application — **pure business logic** with zero framework dependencies. This is where Clean Architecture shines: the core knows nothing about HTTP, databases, or external services.

## Structure

```
src/core/
├── cat/
│   ├── entity/
│   │   └── cat.ts              # CatEntity + CatEntitySchema
│   ├── repository/
│   │   └── cat.ts              # ICatRepository (abstraction)
│   └── use-cases/
│       ├── cat-create.ts       # CatCreateUsecase
│       ├── cat-update.ts       # CatUpdateUsecase
│       ├── cat-delete.ts       # CatDeleteUsecase
│       ├── cat-get-by-id.ts    # CatGetByIdUsecase
│       ├── cat-list.ts         # CatListUsecase
│       └── __tests__/          # Unit tests
│           ├── cat-create.spec.ts
│           └── ...
├── user/
│   └── ...
└── role/
    └── ...
```

Each **domain** (cat, user, role) has the same structure: `entity/`, `repository/`, `use-cases/`.

---

## Core Principles

### 1. Framework Agnostic

The core layer has **no NestJS decorators** (except validation decorators from utils). It's pure TypeScript:

```typescript
// ✅ Core layer — no @Injectable(), no @Module()
export class CatCreateUsecase implements IUsecase {
  constructor(private readonly catRepository: ICatRepository) {}
}
```

### 2. Database Agnostic

Core defines **abstractions** (interfaces), not implementations:

```typescript
// ✅ Core defines the contract
export abstract class ICatRepository extends IRepository<CatEntity> {
  abstract findByName(name: string): Promise<CatEntity | null>
}

// Modules layer provides the implementation
```

### 3. Single Responsibility

Each use case does **exactly one thing**:

```
cat-create.ts     → Creates a cat
cat-update.ts     → Updates a cat
cat-delete.ts     → Deletes a cat (soft delete)
cat-get-by-id.ts  → Gets a cat by ID
cat-list.ts       → Lists cats with pagination
```

---

## Components

| Component | Purpose | Guide |
|-----------|---------|-------|
| **Entity** | Domain object with business rules and Zod schema | [entity.md](./entity.md) |
| **Repository** | Data access abstraction (interface only) | [repository.md](./repository.md) |
| **Use Case** | Single business operation | [usecase.md](./usecase.md) |
| **Tests** | Unit tests for use cases | [test.md](./test.md) |

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         CORE LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Input (from modules/)                                         │
│         │                                                       │
│         ▼                                                       │
│   ┌─────────────┐                                              │
│   │  Use Case   │ ◄── Validates with @ValidateSchema           │
│   └─────────────┘                                              │
│         │                                                       │
│         ├──────────────┐                                       │
│         ▼              ▼                                       │
│   ┌─────────┐    ┌──────────────┐                              │
│   │ Entity  │    │  Repository  │ ◄── Abstract interface       │
│   └─────────┘    └──────────────┘                              │
│         │              │                                       │
│         └──────┬───────┘                                       │
│                ▼                                                │
│   Output (to modules/)                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Creating a New Domain

1. **Create the folder structure:**
   ```
   src/core/product/
   ├── entity/
   ├── repository/
   └── use-cases/
       └── __tests__/
   ```

2. **Create the Entity** — See [entity.md](./entity.md)

3. **Create the Repository Interface** — See [repository.md](./repository.md)

4. **Create Use Cases** — Use the `usecase` snippet. See [usecase.md](./usecase.md)

5. **Create Tests** — Use the `apitest` snippet. See [test.md](./test.md)

---

## Related Links

- [Entity](./entity.md) — Domain entity with Zod schema
- [Repository](./repository.md) — Data access abstraction
- [Use Case](./usecase.md) — Business operations
- [Test](./test.md) — Unit testing patterns
- [Modules Layer](../modules/README.md) — Where abstractions meet implementations
