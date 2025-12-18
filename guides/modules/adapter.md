# Adapter

Adapters define **contracts for use cases** — abstract classes that specify exactly what input goes in and what output comes out.

## A Note on Terminology: Everything is an Adapter

In this codebase, we treat **all interfaces as Adapters** — not in the classic Gang of Four "Adapter Pattern" sense, but as a **simplified mental model**:

> **Adapter = Abstraction with a contract adapted to be consumed**

In traditional Hexagonal Architecture, you have:
- **Ports** — Interfaces defined by the core
- **Adapters** — Implementations that connect to external systems

Here, we **unify both concepts under "Adapter"**:

```
Traditional                    Our Approach
───────────────────────────────────────────────
Port (interface)        →     I{Name}Adapter
Adapter (implementation)      (bound in Module)
```

**Why?** Simplicity. Whether it's a use case contract, a repository interface, or an external service abstraction — they all follow the same pattern: `I{Name}Adapter` or `I{Name}Repository`. This makes the codebase easier to navigate and understand.

---

## Location & Naming Conventions

| Convention | Pattern | Example |
|------------|---------|---------|
| **Folder** | `src/modules/{domain}/` | `src/modules/cat/` |
| **File** | `adapter.ts` | `adapter.ts` |
| **Class** | `I{Domain}{Action}Adapter` | `ICatCreateAdapter` |

---

## Anatomy of an Adapter

```typescript
import { CatCreateInput, CatCreateOutput } from '@/core/cat/use-cases/cat-create'
import { ApiTrancingInput } from '@/utils/request'
import { IUsecase } from '@/utils/usecase'

export abstract class ICatCreateAdapter implements IUsecase {
  abstract execute(input: CatCreateInput, trace: ApiTrancingInput): Promise<CatCreateOutput>
}
```

**Key elements:**

1. **`abstract class`** — Not `interface` (see why below)
2. **`implements IUsecase`** — Follows the use case contract
3. **`abstract execute()`** — Method signature must match the use case
4. **Input/Output from Use Case** — Types come directly from the use case file

---

## Why `abstract class` Instead of `interface`?

This is a **Node.js/TypeScript limitation**, not a design preference.

TypeScript interfaces are **erased at runtime** — they don't exist in the compiled JavaScript. NestJS Dependency Injection needs a **token** to identify what to inject:

```typescript
// ❌ Interface — erased at runtime, can't be used as DI token
interface ICatCreateAdapter {
  execute(input: CatCreateInput): Promise<CatCreateOutput>
}

// Would force us to use string tokens:
{ provide: 'ICatCreateAdapter', useFactory: ... }  // Ugly, error-prone

// ✅ Abstract class — exists at runtime, works as DI token
export abstract class ICatCreateAdapter implements IUsecase {
  abstract execute(input: CatCreateInput): Promise<CatCreateOutput>
}

// Clean DI registration:
{ provide: ICatCreateAdapter, useFactory: ... }  // Type-safe
```

**With abstract class:**
- The class exists at runtime as a constructor function
- NestJS can use it directly as a provider token
- Full type safety — no magic strings
- IDE autocomplete and refactoring work correctly

**With interface + string token:**
- Have to remember exact string names
- No compile-time checking if string matches
- Refactoring doesn't update strings automatically
- Easy to introduce typos

---

## Mandatory: Input and Output Types

**Always** use the Input and Output types exported from the use case:

```typescript
// ✅ Import from the use case
import { CatCreateInput, CatCreateOutput } from '@/core/cat/use-cases/cat-create'

export abstract class ICatCreateAdapter implements IUsecase {
  abstract execute(input: CatCreateInput, trace: ApiTrancingInput): Promise<CatCreateOutput>
}

// ❌ Never redefine types
export abstract class ICatCreateAdapter implements IUsecase {
  abstract execute(input: { name: string }, trace: ApiTrancingInput): Promise<{ id: string }>
}
```

This ensures:
- **Type consistency** between adapter, use case, and controller
- **Single source of truth** — types live in the use case
- **Compile-time safety** — mismatches are caught immediately

---

## Complete Example

```typescript
import { CatCreateInput, CatCreateOutput } from '@/core/cat/use-cases/cat-create'
import { CatDeleteInput, CatDeleteOutput } from '@/core/cat/use-cases/cat-delete'
import { CatGetByIdInput, CatGetByIdOutput } from '@/core/cat/use-cases/cat-get-by-id'
import { CatListInput, CatListOutput } from '@/core/cat/use-cases/cat-list'
import { CatUpdateInput, CatUpdateOutput } from '@/core/cat/use-cases/cat-update'
import { ApiTrancingInput } from '@/utils/request'
import { IUsecase } from '@/utils/usecase'

export abstract class ICatCreateAdapter implements IUsecase {
  abstract execute(input: CatCreateInput, trace: ApiTrancingInput): Promise<CatCreateOutput>
}

export abstract class ICatUpdateAdapter implements IUsecase {
  abstract execute(input: CatUpdateInput, trace: ApiTrancingInput): Promise<CatUpdateOutput>
}

export abstract class ICatGetByIdAdapter implements IUsecase {
  abstract execute(input: CatGetByIdInput): Promise<CatGetByIdOutput>
}

export abstract class ICatListAdapter implements IUsecase {
  abstract execute(input: CatListInput): Promise<CatListOutput>
}

export abstract class ICatDeleteAdapter implements IUsecase {
  abstract execute(input: CatDeleteInput, trace: ApiTrancingInput): Promise<CatDeleteOutput>
}
```

---

## With or Without Tracing

Some use cases need tracing context, others don't:

```typescript
// With tracing — for operations that log events or need user context
export abstract class ICatCreateAdapter implements IUsecase {
  abstract execute(input: CatCreateInput, trace: ApiTrancingInput): Promise<CatCreateOutput>
}

// Without tracing — for simple read operations
export abstract class ICatGetByIdAdapter implements IUsecase {
  abstract execute(input: CatGetByIdInput): Promise<CatGetByIdOutput>
}
```

Match the signature to what the use case actually needs.

---

## How It All Connects

```
┌─────────────────────────────────────────────────────────────────┐
│                        ADAPTER FLOW                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Controller                                                    │
│   └── Injects: ICatCreateAdapter                               │
│                    │                                            │
│                    ▼                                            │
│   Module                                                        │
│   └── Binds: ICatCreateAdapter → CatCreateUsecase              │
│                    │                                            │
│                    ▼                                            │
│   Use Case (core/)                                              │
│   └── CatCreateUsecase implements IUsecase                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

The Adapter is the **contract** that the Controller depends on, and the Module **binds** to the concrete Use Case.

---

## Related Links

- [Module](./module.md) — Where adapters are bound to use cases
- [Controller](./controller.md) — Where adapters are injected
- [Use Case](../core/usecase.md) — The implementation
- [IUsecase](../utils/usecase.md) — Base interface
