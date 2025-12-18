# Controller

Controllers are the **HTTP entry point** of the application. Unlike the Core layer, here we **embrace frameworks** intentionally — NestJS decorators, HTTP semantics, and all the productivity they bring.

## Philosophy: Framework by Design

The Modules layer is where **framework productivity** meets **clean architecture**:

```
Core Layer    → Pure TypeScript, no frameworks, business logic
Modules Layer → NestJS, decorators, HTTP concerns, framework features
```

This is **intentional**. Controllers handle HTTP-specific concerns:
- Route definitions
- HTTP methods and status codes
- Request parsing
- Permission checks
- Version management

The **business logic stays in Core** — controllers just orchestrate.

---

## Location & Naming Conventions

| Convention | Pattern | Example |
|------------|---------|---------|
| **Folder** | `src/modules/{domain}/` | `src/modules/cat/` |
| **File** | `controller.ts` | `controller.ts` |
| **Class** | `{Domain}Controller` | `CatController` |
| **Route** | `/{domain}s` (plural) | `/cats` |

---

## Anatomy of a Controller

```typescript
import { Controller, Delete, Get, HttpCode, Post, Put, Req, Version } from '@nestjs/common'

import { CatCreateInput, CatCreateOutput } from '@/core/cat/use-cases/cat-create'
import { CatDeleteInput, CatDeleteOutput } from '@/core/cat/use-cases/cat-delete'
import { CatGetByIdInput, CatGetByIdOutput } from '@/core/cat/use-cases/cat-get-by-id'
import { CatListInput, CatListOutput } from '@/core/cat/use-cases/cat-list'
import { CatUpdateInput, CatUpdateOutput } from '@/core/cat/use-cases/cat-update'
import { Permission } from '@/utils/decorators'
import { ApiRequest } from '@/utils/request'
import { SearchHttpSchema } from '@/utils/search'
import { SortHttpSchema } from '@/utils/sort'

import { ICatCreateAdapter, ICatDeleteAdapter, ICatGetByIdAdapter, ICatListAdapter, ICatUpdateAdapter } from './adapter'

@Controller('cats')
export class CatController {
  constructor(
    private readonly createUsecase: ICatCreateAdapter,
    private readonly updateUsecase: ICatUpdateAdapter,
    private readonly getByIdUsecase: ICatGetByIdAdapter,
    private readonly listUsecase: ICatListAdapter,
    private readonly deleteUsecase: ICatDeleteAdapter
  ) {}

  // ... methods
}
```

---

## Use Case Injection

Use cases are injected via **Adapter interfaces**, not concrete classes:

```typescript
constructor(
  private readonly createUsecase: ICatCreateAdapter,
  private readonly updateUsecase: ICatUpdateAdapter,
  private readonly getByIdUsecase: ICatGetByIdAdapter,
  private readonly listUsecase: ICatListAdapter,
  private readonly deleteUsecase: ICatDeleteAdapter
) {}
```

**Naming pattern:** `{action}Usecase` → `createUsecase`, `updateUsecase`, `listUsecase`

This allows:
- Easy mocking in tests
- Swapping implementations without changing controller
- Clear contract between layers

See [Adapter](./adapter.md) for the interface pattern.

---

## Mandatory: `@Version()`

**Every route must have a version:**

```typescript
@Post()
@Version('1')  // ✅ Mandatory
async create(...) { }
```

This enables:
- API versioning without breaking changes
- Multiple versions coexisting
- Deprecation paths for clients

---

## Mandatory: `ApiRequest`

**Always use `ApiRequest`** for accessing request data:

```typescript
@Post()
async create(@Req() { body, user, tracing }: ApiRequest): Promise<CatCreateOutput> {
  return await this.createUsecase.execute(body as CatCreateInput, { user, tracing })
}
```

`ApiRequest` provides typed access to:
- `body` — Request body
- `params` — Route parameters
- `query` — Query string
- `user` — Authenticated user
- `tracing` — Tracing context

See [Request Utils](../utils/request.md).

---

## REST Semantics

Follow standard HTTP semantics:

| Operation | Method | Route | Status | Example |
|-----------|--------|-------|--------|---------|
| Create | `POST` | `/cats` | `201` | `@Post() @HttpCode(201)` |
| Update | `PUT` | `/cats/:id` | `200` | `@Put(':id')` |
| Get One | `GET` | `/cats/:id` | `200` | `@Get(':id')` |
| List | `GET` | `/cats` | `200` | `@Get()` |
| Delete | `DELETE` | `/cats/:id` | `200` | `@Delete(':id')` |

```typescript
@Post()
@Version('1')
@Permission('cat:create')
@HttpCode(201)  // ✅ POST returns 201 Created
async create(@Req() { body, user, tracing }: ApiRequest): Promise<CatCreateOutput> {
  return await this.createUsecase.execute(body as CatCreateInput, { user, tracing })
}
```

---

## Permission Decorator

Use `@Permission()` for routes that require authorization:

```typescript
@Post()
@Version('1')
@Permission('cat:create')  // ✅ Requires 'cat:create' permission
async create(...) { }
```

**Pattern:** `{domain}:{action}` → `cat:create`, `cat:update`, `cat:delete`

If a route is public (no auth required), omit the decorator.

See [Permission Decorator](../decorators/permission.md).

---

## Pagination Pattern

For list endpoints, use this standard pattern:

```typescript
@Get()
@Version('1')
@Permission('cat:list')
async list(@Req() { query }: ApiRequest): Promise<CatListOutput> {
  const input: CatListInput = {
    sort: SortHttpSchema.parse(query.sort),
    search: SearchHttpSchema.parse(query.search),
    limit: Number(query.limit),
    page: Number(query.page)
  }

  return await this.listUsecase.execute(input)
}
```

**Key points:**
- `SortHttpSchema.parse()` — Parses sort query string (e.g., `?sort=name:asc`)
- `SearchHttpSchema.parse()` — Parses search filters
- `Number()` — Converts string query params to numbers
- Input is typed as `CatListInput`

See [Sort Utils](../utils/sort.md) and [Search Utils](../utils/search.md).

---

## Complete Example

```typescript
@Controller('cats')
export class CatController {
  constructor(
    private readonly createUsecase: ICatCreateAdapter,
    private readonly updateUsecase: ICatUpdateAdapter,
    private readonly getByIdUsecase: ICatGetByIdAdapter,
    private readonly listUsecase: ICatListAdapter,
    private readonly deleteUsecase: ICatDeleteAdapter
  ) {}

  @Post()
  @Version('1')
  @Permission('cat:create')
  @HttpCode(201)
  async create(@Req() { body, user, tracing }: ApiRequest): Promise<CatCreateOutput> {
    return await this.createUsecase.execute(body as CatCreateInput, { user, tracing })
  }

  @Put(':id')
  @Version('1')
  @Permission('cat:update')
  async update(@Req() { body, user, tracing, params }: ApiRequest): Promise<CatUpdateOutput> {
    return await this.updateUsecase.execute({ ...body, id: params.id } as CatUpdateInput, { user, tracing })
  }

  @Get(':id')
  @Version('1')
  @Permission('cat:getbyid')
  async getById(@Req() { params }: ApiRequest): Promise<CatGetByIdOutput> {
    return await this.getByIdUsecase.execute(params as CatGetByIdInput)
  }

  @Get()
  @Version('1')
  @Permission('cat:list')
  async list(@Req() { query }: ApiRequest): Promise<CatListOutput> {
    const input: CatListInput = {
      sort: SortHttpSchema.parse(query.sort),
      search: SearchHttpSchema.parse(query.search),
      limit: Number(query.limit),
      page: Number(query.page)
    }

    return await this.listUsecase.execute(input)
  }

  @Delete(':id')
  @Version('1')
  @Permission('cat:delete')
  async delete(@Req() { params, user, tracing }: ApiRequest): Promise<CatDeleteOutput> {
    return await this.deleteUsecase.execute(params as CatDeleteInput, { user, tracing })
  }
}
```

---

## Related Links

- [Adapter](./adapter.md) — Use case interface adapters
- [Module](./module.md) — NestJS module wiring
- [Repository](./repository.md) — Repository implementation
- [Permission Decorator](../decorators/permission.md) — Authorization
- [Request Utils](../utils/request.md) — ApiRequest type
- [Sort Utils](../utils/sort.md) — Sort parsing
- [Search Utils](../utils/search.md) — Search parsing
