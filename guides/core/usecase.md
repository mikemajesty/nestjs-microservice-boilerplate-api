# Use Case

Use Cases are the **core of Clean Architecture**. They orchestrate the flow of data and business rules, representing a single **user intention** or **system operation**.

## A Note on Clean Architecture: Input Validation Inside the Use Case

This implementation differs from traditional Clean Architecture in one important aspect: **input validation happens inside the use case**, not in an external layer.

In classic Clean Architecture, validation typically occurs in a separate "Input Boundary" or "Request Model" layer before reaching the use case. Here, we chose a different approach — the `@ValidateSchema` decorator validates input **as the first step of the use case execution**.

### Why This Design Decision?

**1. The Use Case Must Be Self-Contained**

A use case should be **complete and testable in isolation**. If validation lives outside, you can't test the use case without also setting up the validation layer. That feels wrong — a use case that accepts invalid data isn't a real use case.

```typescript
// ✅ Self-contained — validation is part of the use case
@ValidateSchema(CatCreateSchema)
async execute(input: CatCreateInput): Promise<CatCreateOutput>

// ❌ Dependent — use case trusts external validation blindly
async execute(input: CatCreateInput): Promise<CatCreateOutput>
```

**2. Input Validation IS Business Logic**

What constitutes "valid input" is a **business decision**:
- "Name must be between 2 and 100 characters" — business rule
- "Age must be positive" — business rule
- "Email must be unique" — business rule

These aren't just technical constraints — they're domain knowledge. They belong in the core, not in the HTTP layer.

**3. Tests Become Meaningful**

When testing a use case, the **first test is always input validation**:

```typescript
test('when no input is specified, should expect an error', async () => {
  await TestUtils.expectZodError(
    () => usecase.execute({} as CatCreateInput, TestUtils.getMockTracing()),
    (issues) => {
      expect(issues).toEqual([...])
    }
  )
})
```

This test would be meaningless if validation happened elsewhere. The use case **defines** what valid input looks like — so it should **enforce** it too.

**4. Single Source of Truth**

The Schema lives next to the use case, and the Input type is derived from it:

```typescript
export const CatCreateSchema = CatEntitySchema.pick({ name: true, breed: true, age: true })
export type CatCreateInput = Infer<typeof CatCreateSchema>
```

One file. One schema. One type. No duplication. No drift.

**5. Framework Independence**

Even though `@ValidateSchema` is a decorator, it's **our decorator** — not a framework feature. The validation logic (Zod) is pure TypeScript. You could run this use case from a CLI, a message queue, or a test — and validation would still work identically.

---

## VS Code Snippet

Before diving into patterns, there's a **snippet** that generates the entire use case structure automatically:

```
1. Create a new file: cat-create.ts
2. Type: usecase
3. Press Tab
4. Done! ✨
```

The snippet is located at `.vscode/usecase.code-snippets` and generates:
- Import statements
- Schema derived from entity
- Class implementing `IUsecase`
- `@ValidateSchema` decorator
- Input/Output types at the bottom

This ensures every use case follows the **exact same pattern** from day one.

---

## Use Cases vs Services

In traditional architectures, you often see a `Service` pattern:

```typescript
// ❌ Traditional Service - Multiple responsibilities
@Injectable()
export class CatService {
  async create(input) { /* ... */ }
  async update(input) { /* ... */ }
  async delete(input) { /* ... */ }
  async getById(input) { /* ... */ }
  async list(input) { /* ... */ }
  async importFromCsv(input) { /* ... */ }
  async exportToPdf(input) { /* ... */ }
  // 500+ lines, growing forever...
}
```

**Problems:**
- Single file becomes massive (god class)
- Hard to test individual operations
- Changes in one method can break others
- Multiple developers conflict on same file
- Unclear boundaries between operations

```typescript
// ✅ Use Case Pattern - Single Responsibility
cat-create.ts     → CatCreateUsecase
cat-update.ts     → CatUpdateUsecase  
cat-delete.ts     → CatDeleteUsecase
cat-get-by-id.ts  → CatGetByIdUsecase
cat-list.ts       → CatListUsecase
```

**Benefits:**
- **One file = One operation** — Easy to find, test, modify
- **Single Responsibility** — Each use case does exactly one thing
- **Parallel development** — Multiple devs, no conflicts
- **Clear boundaries** — Input → Process → Output
- **Testable** — Small, focused unit tests

---

## Architecture Role

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLEAN ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │  Controller (modules/)                                       │  │
│   │  HTTP layer - receives request, calls use case               │  │
│   └──────────────────────────┬──────────────────────────────────┘  │
│                              │                                      │
│                              ▼                                      │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │  Use Case (core/)                                            │  │
│   │  Business logic - validates, orchestrates, returns           │  │
│   │                                                              │  │
│   │  • Receives input from controller                            │  │
│   │  • Validates with @ValidateSchema                            │  │
│   │  • Uses Entity for business rules                            │  │
│   │  • Uses Repository for persistence                           │  │
│   │  • Returns typed output                                      │  │
│   └──────────────────────────┬──────────────────────────────────┘  │
│                              │                                      │
│              ┌───────────────┼───────────────┐                     │
│              ▼               ▼               ▼                     │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│   │   Entity     │  │  Repository  │  │    Libs      │            │
│   │   (core/)    │  │   (core/)    │  │  (infra/)    │            │
│   └──────────────┘  └──────────────┘  └──────────────┘            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

The Use Case is the **orchestrator** — it knows **what** needs to happen, but delegates **how** to other components.

---

## Location & Naming Conventions

| Convention | Pattern | Example |
|------------|---------|---------|
| **Folder** | `src/core/{domain}/use-cases/` | `src/core/cat/use-cases/` |
| **File** | `{domain}-{action}.ts` | `cat-create.ts` |
| **Class** | `{Domain}{Action}Usecase` | `CatCreateUsecase` |
| **Schema** | `{Domain}{Action}Schema` | `CatCreateSchema` |
| **Input Type** | `{Domain}{Action}Input` | `CatCreateInput` |
| **Output Type** | `{Domain}{Action}Output` | `CatCreateOutput` |

---

## Anatomy of a Use Case

```typescript
// src/core/cat/use-cases/cat-create.ts

// 1️⃣ External imports first
import { CreatedModel } from '@/infra/repository'
import { ValidateSchema } from '@/utils/decorators'
import { IDGeneratorUtils } from '@/utils/id-generator'
import { ApiTrancingInput } from '@/utils/request'
import { IUsecase } from '@/utils/usecase'
import { Infer } from '@/utils/validator'

// 2️⃣ Internal imports (same domain)
import { CatEntity, CatEntitySchema } from '../entity/cat'
import { ICatRepository } from '../repository/cat'

// 3️⃣ Schema - derived from Entity schema
export const CatCreateSchema = CatEntitySchema.pick({
  name: true,
  breed: true,
  age: true
})

// 4️⃣ Use Case class
export class CatCreateUsecase implements IUsecase {
  // 5️⃣ Dependencies via constructor
  constructor(private readonly catRepository: ICatRepository) {}

  // 6️⃣ Single method with validation decorator
  @ValidateSchema(CatCreateSchema)
  async execute(input: CatCreateInput, { tracing, user }: ApiTrancingInput): Promise<CatCreateOutput> {
    // 7️⃣ Business logic
    const entity = new CatEntity({ id: IDGeneratorUtils.uuid(), ...input })

    const created = await this.catRepository.create(entity.toObject())

    tracing.logEvent('cat-created', `cat created by: ${user.email}`)

    return created
  }
}

// 8️⃣ Types at the bottom - exported first, private after
export type CatCreateInput = Infer<typeof CatCreateSchema>
export type CatCreateOutput = CreatedModel
```

---

## Key Components

### `IUsecase` Interface

Every use case implements `IUsecase`:

```typescript
export interface IUsecase {
  execute(...input: unknown[]): Promise<unknown>
}
```

See [UseCase Utils](../utils/usecase.md) for details.

### `@ValidateSchema` Decorator

**Mandatory** on every `execute()` method:

```typescript
@ValidateSchema(CatCreateSchema)
async execute(input: CatCreateInput): Promise<CatCreateOutput>
```

Validates input before execution. See [ValidateSchema](../decorators/validate-schema.md).

### `ApiTrancingInput`

For operations that need tracing or user context:

```typescript
async execute(input: CatCreateInput, { tracing, user }: ApiTrancingInput)
```

See [Request Utils](../utils/request.md).

### `ICatRepository`

Injected via constructor — the abstract interface from `core/`:

```typescript
constructor(private readonly catRepository: ICatRepository) {}
```

See [Repository (Core)](./repository.md).

---

## Schema Patterns

### Why Schema is Required

Every use case **must** have a Schema, even for simple operations. This is a best practice because:

1. **Type Safety** — Input type is inferred from Schema via `Infer<typeof Schema>`
2. **Validation** — `@ValidateSchema` uses it to validate input at runtime
3. **Mock Generation** — The mock library can generate test data from the Schema automatically

```typescript
// ✅ Schema + Infer = Type safety + Mock generation
export const CatDeleteSchema = CatEntitySchema.pick({ id: true })

export type CatDeleteInput = Infer<typeof CatDeleteSchema>
```

With this pattern, you can generate mocks in tests:

```typescript
// The mock lib reads the Schema and generates valid test data
const input = MockUtils.toJSON(CatDeleteSchema)
// { id: '550e8400-e29b-41d4-a716-446655440000' }
```

See [Mock Utils](../tests/mock.md) for details.

---

### Derive Schema from Entity (Best Practice)

**Always** derive use case schemas from the Entity schema when properties match:

```typescript
// ✅ Derived from Entity — single source of truth
export const CatCreateSchema = CatEntitySchema.pick({
  name: true,
  breed: true,
  age: true
})

// ❌ Duplicated — will drift over time
export const CatCreateSchema = z.object({
  name: z.string().min(2).max(200),
  breed: z.string().min(2).max(200),
  age: z.number().min(0).max(200)
})
```

**Why this matters:**

1. **Single Source of Truth** — Entity defines the domain rules, use case reuses them
2. **No Drift** — Change validation in Entity, all use cases update automatically
3. **Less Code** — `.pick()`, `.omit()`, `.partial()` instead of rewriting
4. **Consistency** — Same validation rules everywhere

Use Zod's composition methods:
- `.pick({ field: true })` — Select specific fields
- `.omit({ field: true })` — Exclude specific fields
- `.partial()` — Make all fields optional
- `.and()` — Combine schemas

---

### Pick from Entity (Create)

```typescript
export const CatCreateSchema = CatEntitySchema.pick({
  name: true,
  breed: true,
  age: true
})
```

### Pick ID only (GetById, Delete)

```typescript
export const CatGetByIdSchema = CatEntitySchema.pick({
  id: true
})
```

### ID required + rest optional (Update)

```typescript
export const CatUpdateSchema = CatEntitySchema.pick({
  id: true
}).and(CatEntitySchema.omit({ id: true }).partial())
```

### Pagination + Search + Sort (List)

```typescript
export const CatListSchema = InputValidator
  .intersection(PaginationSchema, SortSchema)
  .and(SearchSchema)
```

---

## Type Organization

**Rule:** Exported types come first, private types after.

```typescript
// ✅ Correct order
export type CatCreateInput = Infer<typeof CatCreateSchema>
export type CatCreateOutput = CreatedModel

type InternalHelper = { ... }  // Private types after
```

---

## Common Patterns

### Always Instantiate Entity from Database Results

When fetching data from the database, **always** wrap it in `new Entity()`:

```typescript
const cat = await this.catRepository.findById(id)
if (!cat) throw new ApiNotFoundException()

const entity = new CatEntity(cat)  // ✅ Always instantiate
```

**Why this matters:**

1. **Access to Entity Methods** — `entity.merge()`, `entity.deactivate()`, `entity.toObject()`
2. **ID Normalization** — MongoDB uses `_id`, but Entity normalizes to `id`
3. **Database Agnostic** — Entity has NO knowledge of database specifics

```typescript
// MongoDB returns:
{ _id: '507f1f77bcf86cd799439011', name: 'Mia' }

// After new CatEntity():
{ id: '507f1f77bcf86cd799439011', name: 'Mia' }  // ✅ Normalized
```

The Entity **never** has `_id` property — it only knows `id`. This keeps the domain layer clean and database-agnostic.

---

### Create

```typescript
export class CatCreateUsecase implements IUsecase {
  constructor(private readonly catRepository: ICatRepository) {}

  @ValidateSchema(CatCreateSchema)
  async execute(input: CatCreateInput, { tracing, user }: ApiTrancingInput): Promise<CatCreateOutput> {
    const entity = new CatEntity({ id: IDGeneratorUtils.uuid(), ...input })
    const created = await this.catRepository.create(entity.toObject())
    tracing.logEvent('cat-created', `cat created by: ${user.email}`)
    return created
  }
}
```

> **Note:** `IDGeneratorUtils.uuid()` is optional if your Entity uses `ensureId()` in the constructor. See [Entity](./entity.md).

### GetById

```typescript
export class CatGetByIdUsecase implements IUsecase {
  constructor(private readonly catRepository: ICatRepository) {}

  @ValidateSchema(CatGetByIdSchema)
  async execute({ id }: CatGetByIdInput): Promise<CatGetByIdOutput> {
    const cat = await this.catRepository.findById(id)
    if (!cat) throw new ApiNotFoundException()
    return new CatEntity(cat).toObject()
  }
}
```

### Update

```typescript
export class CatUpdateUsecase implements IUsecase {
  constructor(
    private readonly catRepository: ICatRepository,
    private readonly loggerService: ILoggerAdapter
  ) {}

  @ValidateSchema(CatUpdateSchema)
  async execute(input: CatUpdateInput, { tracing, user }: ApiTrancingInput): Promise<CatUpdateOutput> {
    const cat = await this.catRepository.findById(input.id)
    if (!cat) throw new ApiNotFoundException()

    const entity = new CatEntity(cat)
    entity.merge(input)

    await this.catRepository.updateOne({ id: entity.id }, entity.toObject())
    this.loggerService.info({ message: 'cat updated.', obj: { cat: input } })

    const updated = await this.catRepository.findById(entity.id)
    tracing.logEvent('cat-updated', `cat updated by: ${user.email}`)

    return new CatEntity(updated as CatEntity).toObject()
  }
}
```

### Delete (Soft Delete)

```typescript
export class CatDeleteUsecase implements IUsecase {
  constructor(private readonly catRepository: ICatRepository) {}

  @ValidateSchema(CatDeleteSchema)
  async execute({ id }: CatDeleteInput, { tracing, user }: ApiTrancingInput): Promise<CatDeleteOutput> {
    const cat = await this.catRepository.findById(id)
    if (!cat) throw new ApiNotFoundException()

    const entity = new CatEntity(cat)
    entity.deactivate()  // Sets deletedAt

    await this.catRepository.updateOne({ id: entity.id }, entity.toObject())
    tracing.logEvent('cat-deleted', `cat deleted by: ${user.email}`)

    return entity.toObject()
  }
}
```

### List

```typescript
export class CatListUsecase implements IUsecase {
  constructor(private readonly catRepository: ICatRepository) {}

  @ValidateSchema(CatListSchema)
  async execute(input: CatListInput): Promise<CatListOutput> {
    return await this.catRepository.paginate(input)
  }
}
```

---

## Connecting Use Case to the Application

Use cases live in `core/` — they're **pure business logic** with no framework awareness. To expose them to the HTTP layer, we need two things in `modules/`:

### 1. Adapter — The Contract

An **Adapter** defines the use case contract for dependency injection:

```typescript
// modules/cat/adapter.ts
export abstract class ICatCreateAdapter implements IUsecase {
  abstract execute(input: CatCreateInput, trace: ApiTrancingInput): Promise<CatCreateOutput>
}
```

See [Adapter](../modules/adapter.md) for details.

### 2. Module — The Binding

The **Module** binds the abstract Adapter to the concrete Use Case:

```typescript
// modules/cat/module.ts
{
  provide: ICatCreateAdapter,
  useFactory: (repository: ICatRepository) => new CatCreateUsecase(repository),
  inject: [ICatRepository]
}
```

See [Module](../modules/module.md) for details.

### 3. Controller — The Consumer

The **Controller** injects the Adapter (not the Use Case directly):

```typescript
// modules/cat/controller.ts
constructor(private readonly createUsecase: ICatCreateAdapter) {}

@Post()
async create(@Req() { body, user, tracing }: ApiRequest): Promise<CatCreateOutput> {
  return await this.createUsecase.execute(body as CatCreateInput, { user, tracing })
}
```

See [Controller](../modules/controller.md) for details.

---

## Related Links

- [IUsecase](../utils/usecase.md) — Use case interface
- [ValidateSchema](../decorators/validate-schema.md) — Input validation decorator
- [Entity](./entity.md) — Domain entity
- [Repository](./repository.md) — Data access abstraction
- [Validator](../utils/validator.md) — Zod/InputValidator
- [Request](../utils/request.md) — ApiTrancingInput
- [Adapter](../modules/adapter.md) — Use case contract for DI
- [Module](../modules/module.md) — Where use case meets adapter
- [Controller](../modules/controller.md) — HTTP entry point