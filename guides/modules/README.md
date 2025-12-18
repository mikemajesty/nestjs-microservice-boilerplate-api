# Modules Layer

The **Modules Layer** is where **framework meets business logic**. Unlike the Core layer (pure TypeScript), here we **embrace NestJS** — decorators, dependency injection, HTTP concerns, and all the productivity they bring.

## Philosophy: Framework by Design

```
Core Layer    → Pure TypeScript, no frameworks, business logic only
Modules Layer → NestJS, decorators, HTTP, database specifics
```

This separation is **intentional**:
- Core can be tested without any framework
- Modules handle all infrastructure concerns
- Swapping frameworks only affects Modules, not Core

---

## Structure

```
src/modules/
├── cat/
│   ├── adapter.ts       # Use case contracts (ICatCreateAdapter, etc.)
│   ├── controller.ts    # HTTP entry point
│   ├── module.ts        # NestJS wiring
│   └── repository.ts    # ICatRepository implementation
├── user/
│   └── ...
├── login/
│   └── ...
└── health/
    └── ...
```

Each **module** has the same structure: `adapter.ts`, `controller.ts`, `module.ts`, `repository.ts`.

---

## Where Abstraction Meets Implementation

This is the key insight — Modules is where **Core abstractions become real**:

```
Core (abstraction)           →  Modules (implementation)
─────────────────────────────────────────────────────────
ICatRepository               →  CatRepository
ICatCreateAdapter            →  bound to CatCreateUsecase
ICatUpdateAdapter            →  bound to CatUpdateUsecase
```

The `module.ts` is the glue:

```typescript
// Binding abstraction to implementation
{ provide: ICatRepository, useFactory: ... → new CatRepository(...) }
{ provide: ICatCreateAdapter, useFactory: ... → new CatCreateUsecase(...) }
```

---

## Components

| Component | Purpose | Guide |
|-----------|---------|-------|
| **Controller** | HTTP entry point, routes, decorators | [controller.md](./controller.md) |
| **Adapter** | Use case contracts for DI | [adapter.md](./adapter.md) |
| **Module** | NestJS wiring, bindings | [module.md](./module.md) |
| **Repository** | Database implementation | [repository.md](./repository.md) |
| **Test (E2E)** | Integration tests with Testcontainers | [test.md](./test.md) |

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                       MODULES LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   HTTP Request                                                  │
│         │                                                       │
│         ▼                                                       │
│   ┌─────────────┐                                              │
│   │ Controller  │ ◄── @Version, @Permission, ApiRequest        │
│   └─────────────┘                                              │
│         │                                                       │
│         │ Injects ICatCreateAdapter                            │
│         ▼                                                       │
│   ┌─────────────┐                                              │
│   │   Module    │ ◄── Binds Adapter → UseCase                  │
│   └─────────────┘     Binds IRepository → Repository           │
│         │                                                       │
│         ▼                                                       │
│   ┌─────────────┐          ┌──────────────┐                    │
│   │  Use Case   │ ◄──────► │  Repository  │                    │
│   │   (core/)   │          │  (modules/)  │                    │
│   └─────────────┘          └──────────────┘                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Creating a New Module

1. **Create the folder:**
   ```
   src/modules/product/
   ```

2. **Create the Adapter** — Define use case contracts
   ```typescript
   // adapter.ts
   export abstract class IProductCreateAdapter implements IUsecase { ... }
   ```
   See [adapter.md](./adapter.md)

3. **Create the Repository** — Implement the Core repository interface
   ```typescript
   // repository.ts
   export class ProductRepository extends MongoRepository<ProductDocument> implements IProductRepository { ... }
   ```
   See [repository.md](./repository.md)

4. **Create the Controller** — HTTP routes
   ```typescript
   // controller.ts
   @Controller('products')
   export class ProductController { ... }
   ```
   See [controller.md](./controller.md)

5. **Create the Module** — Wire everything together
   ```typescript
   // module.ts
   @Module({ ... })
   export class ProductModule implements NestModule { ... }
   ```
   See [module.md](./module.md)

6. **Register in AppModule** — Import the new module
   ```typescript
   // app.module.ts
   @Module({ imports: [..., ProductModule] })
   ```

---

## Related Links

- [Controller](./controller.md) — HTTP entry point
- [Adapter](./adapter.md) — Use case contracts
- [Module](./module.md) — NestJS wiring
- [Repository](./repository.md) — Database implementation
- [Test (E2E)](./test.md) — Integration tests with Testcontainers
- [Core Layer](../core/README.md) — Business logic (abstractions)
