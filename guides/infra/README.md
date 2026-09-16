# Infra

> **Note:** The `infra` folder contains all **infrastructure services** — external integrations like databases, cache, HTTP clients, email, logging, and secrets management. These are the building blocks that the application layer depends on.

## Architecture

```
src/infra/
├── module.ts           # Imports/exports all infra modules
├── cache/              # Redis + Memory cache
├── database/           # MongoDB + PostgreSQL
├── email/              # Email service with templates
├── http/               # HTTP client (Axios wrapper)
├── logger/             # Structured logging (Pino + Loki)
├── repository/         # Database-agnostic repository pattern
└── secrets/            # Environment variables with Zod validation
```

## Modules

| Guide                         | Implementation                             | Description                                                          |
| ----------------------------- | ------------------------------------------ | -------------------------------------------------------------------- |
| [Secrets](./secrets.md)       | [secrets/](../../src/infra/secrets/)       | Centralized env management with Zod validation, fail-fast on startup |
| [Logger](./logger.md)         | [logger/](../../src/infra/logger/)         | Pino logger with Loki shipping, auto traceid, cURL on errors         |
| [HTTP](./http.md)             | [http/](../../src/infra/http/)             | Axios wrapper with retry, better stack traces, builder pattern       |
| [Email](./email.md)           | [email/](../../src/infra/email/)           | Nodemailer + Handlebars templates, event-driven                      |
| [Cache](./cache.md)           | [cache/](../../src/infra/cache/)           | ICacheAdapter for Redis and Memory (node-cache)                      |
| [Database](./database.md)     | [database/](../../src/infra/database/)     | Schemas and migrations for MongoDB and PostgreSQL                    |
| [Repository](./repository.md) | [repository/](../../src/infra/repository/) | IRepository pattern for database-agnostic data access                |

## Adding a New Infra Module

### Using Scaffold (Recommended)

The best practice is to use the scaffold command to create new infra modules:

```bash
npm run scaffold
```

Then select **INFRA**:

```
Selecting template...
( ) POSTGRES:CRUD
( ) MONGO:CRUD
( ) LIB
(x) INFRA
( ) MODULE
( ) CORE
```

This generates the correct structure with all boilerplate code.

### Manual Registration

After creating (via scaffold or manually), you **must** register it in `src/infra/module.ts`:

```typescript
// src/infra/module.ts
import { Module } from '@nestjs/common'

import { MemoryCacheModule } from './cache/memory'
import { CacheRedisModule } from './cache/redis'
import { MongoDatabaseModule } from './database/mongo'
import { PostgresDatabaseModule } from './database/postgres/module'
import { EmailModule } from './email'
import { HttpModule } from './http'
import { LoggerModule } from './logger'
import { SecretsModule } from './secrets'
import { NewModule } from './new-module' // 👈 1. Import

@Module({
  imports: [
    SecretsModule,
    MongoDatabaseModule,
    PostgresDatabaseModule,
    LoggerModule,
    HttpModule,
    CacheRedisModule,
    MemoryCacheModule,
    EmailModule,
    NewModule // 👈 2. Add to imports
  ],
  exports: [
    SecretsModule,
    MongoDatabaseModule,
    PostgresDatabaseModule,
    LoggerModule,
    HttpModule,
    CacheRedisModule,
    MemoryCacheModule,
    EmailModule,
    NewModule // 👈 3. Add to exports
  ]
})
export class InfraModule {}
```

### Module Structure Pattern

```
src/infra/new-module/
├── adapter.ts      # Abstract interface (INewModuleAdapter)
├── service.ts      # Implementation
├── module.ts       # NestJS module
├── index.ts        # Re-exports
└── types.ts        # TypeScript types (optional)
```

## Key Concepts

### Adapter Pattern

All infra modules use the **adapter pattern**:

- `adapter.ts` — Abstract class defining the interface
- `service.ts` — Concrete implementation

This allows:

- Easy mocking in tests
- Swapping implementations (e.g., Redis → Memory)
- Loose coupling with business logic

### Example

```typescript
// adapter.ts
export abstract class INewModuleAdapter {
  abstract doSomething(input: Input): Promise<Output>
}

// service.ts
@Injectable()
export class NewModuleService implements INewModuleAdapter {
  async doSomething(input: Input): Promise<Output> {
    // implementation
  }
}

// module.ts
@Module({
  providers: [
    {
      provide: INewModuleAdapter,
      useClass: NewModuleService
    }
  ],
  exports: [INewModuleAdapter]
})
export class NewModule {}
```

### Usage in Other Modules

```typescript
// In any module that needs it
import { INewModuleAdapter } from '@/infra/new-module'

@Injectable()
export class SomeService {
  constructor(private readonly newModule: INewModuleAdapter) {}

  async execute() {
    await this.newModule.doSomething(input)
  }
}
```
