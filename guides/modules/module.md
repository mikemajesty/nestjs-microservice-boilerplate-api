# Module

The Module is where **everything comes together** — the NestJS wiring that connects Core abstractions to their implementations. This is where **Dependency Injection magic happens**.

## Where Abstraction Meets Implementation

Remember the Core layer defines **abstractions** (interfaces)? The Module is where we provide **concrete implementations**:

```
Core (abstraction)           →  Module (implementation)
─────────────────────────────────────────────────────────
ICatRepository               →  CatRepository
ICatCreateAdapter            →  CatCreateUsecase
ICatUpdateAdapter            →  CatUpdateUsecase
```

---

## Location & Naming Conventions

| Convention | Pattern | Example |
|------------|---------|---------|
| **Folder** | `src/modules/{domain}/` | `src/modules/cat/` |
| **File** | `module.ts` | `module.ts` |
| **Class** | `{Domain}Module` | `CatModule` |

---

## Anatomy of a Module

```typescript
@Module({
  imports: [TokenLibModule, LoggerModule, RedisCacheModule],
  controllers: [CatController],
  providers: [
    // Repository binding
    { provide: ICatRepository, useFactory: ..., inject: [...] },
    
    // Use case bindings
    { provide: ICatCreateAdapter, useFactory: ..., inject: [...] },
    { provide: ICatUpdateAdapter, useFactory: ..., inject: [...] },
    { provide: ICatGetByIdAdapter, useFactory: ..., inject: [...] },
    { provide: ICatListAdapter, useFactory: ..., inject: [...] },
    { provide: ICatDeleteAdapter, useFactory: ..., inject: [...] }
  ],
  exports: [...]
})
export class CatModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthenticationMiddleware).forRoutes(CatController)
  }
}
```

---

## Binding Use Cases to Adapters

Each use case is bound to its **Adapter interface**:

```typescript
{
  provide: ICatCreateAdapter,
  useFactory: (repository: ICatRepository) => new CatCreateUsecase(repository),
  inject: [ICatRepository]
},
{
  provide: ICatUpdateAdapter,
  useFactory: (logger: ILoggerAdapter, repository: ICatRepository) => new CatUpdateUsecase(repository, logger),
  inject: [ILoggerAdapter, ICatRepository]
},
{
  provide: ICatGetByIdAdapter,
  useFactory: (repository: ICatRepository) => new CatGetByIdUsecase(repository),
  inject: [ICatRepository]
},
{
  provide: ICatListAdapter,
  useFactory: (repository: ICatRepository) => new CatListUsecase(repository),
  inject: [ICatRepository]
},
{
  provide: ICatDeleteAdapter,
  useFactory: (repository: ICatRepository) => new CatDeleteUsecase(repository),
  inject: [ICatRepository]
}
```

**Pattern:**
- `provide:` — The abstract Adapter interface
- `useFactory:` — Instantiates the concrete Use Case
- `inject:` — Dependencies to inject (repository, logger, etc.)

See [Adapter](./adapter.md) for the interface definitions.

---

## Export What Others Need

**Best practice:** Export adapters and repositories that other modules might use:

```typescript
exports: [
  ICatRepository,
  ICatCreateAdapter,
  ICatUpdateAdapter,
  ICatGetByIdAdapter,
  ICatListAdapter,
  ICatDeleteAdapter
]
```

This allows other modules to:
- Import `CatModule` and use its use cases
- Compose features across modules

---

## Authentication Middleware

Apply authentication to all controller routes:

```typescript
export class CatModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthenticationMiddleware).forRoutes(CatController)
  }
}
```

See [Authentication Middleware](../middlewares/authentication.middleware.md).

---

## Repository Binding: MongoDB vs PostgreSQL

The repository binding differs based on the database adapter.

### PostgreSQL (TypeORM)

For PostgreSQL, use the standard `TypeOrmModule.forFeature()`:

```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([UserSchema]),  // Standard TypeORM integration
    // ...
  ],
  providers: [
    {
      provide: IUserRepository,
      useFactory: (repository: Repository<UserSchema & UserEntity>) => {
        return new UserRepository(repository)
      },
      inject: [getRepositoryToken(UserSchema)]
    },
    // ...
  ]
})
```

### MongoDB (Mongoose) — Custom Registration

For MongoDB, we use a **custom registration pattern** instead of the standard `MongooseModule.forFeature()`:

```typescript
// ❌ Standard NestJS/Mongoose way (we don't use this)
MongooseModule.forFeature([{ name: Cat.name, schema: CatSchema }])

// ✅ Our approach — manual model registration
{
  provide: ICatRepository,
  useFactory: async (connection: Connection) => {
    type Model = mongoose.PaginateModel<CatDocument>

    // This does the same as MongooseModule.forFeature internally
    const repository: MongoRepositoryModelSessionType<PaginateModel<CatDocument>> = connection.model<
      CatDocument,
      Model
    >(Cat.name, CatSchema as Schema)

    // Attach connection for transaction support
    repository.connection = connection

    return new CatRepository(repository)
  },
  inject: [getConnectionToken(ConnectionName.CATS)]
}
```

**Why this approach?**

1. **Transaction Support** — Attaching `connection` to the model enables transactions
2. **Multiple Connections** — Each domain can use a different database connection
3. **More Control** — We control exactly how the model is registered
4. **Same Result** — `connection.model()` does exactly what `MongooseModule.forFeature()` does internally

**Key elements:**
- `getConnectionToken(ConnectionName.CATS)` — Gets the specific MongoDB connection
- `connection.model<CatDocument, Model>()` — Registers the model manually
- `repository.connection = connection` — Enables transaction support
- `MongoRepositoryModelSessionType` — Type that includes connection for sessions

---

## Complete Example: MongoDB

```typescript
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { getConnectionToken } from '@nestjs/mongoose'
import mongoose, { Connection, PaginateModel, Schema } from 'mongoose'

import { ICatRepository } from '@/core/cat/repository/cat'
import { CatCreateUsecase } from '@/core/cat/use-cases/cat-create'
import { CatDeleteUsecase } from '@/core/cat/use-cases/cat-delete'
import { CatGetByIdUsecase } from '@/core/cat/use-cases/cat-get-by-id'
import { CatListUsecase } from '@/core/cat/use-cases/cat-list'
import { CatUpdateUsecase } from '@/core/cat/use-cases/cat-update'
import { RedisCacheModule } from '@/infra/cache/redis'
import { ConnectionName } from '@/infra/database/enum'
import { Cat, CatDocument, CatSchema } from '@/infra/database/mongo/schemas/cat'
import { ILoggerAdapter, LoggerModule } from '@/infra/logger'
import { TokenLibModule } from '@/libs/token'
import { AuthenticationMiddleware } from '@/middlewares/middlewares'
import { MongoRepositoryModelSessionType } from '@/utils/mongoose'

import { ICatCreateAdapter, ICatDeleteAdapter, ICatGetByIdAdapter, ICatListAdapter, ICatUpdateAdapter } from './adapter'
import { CatController } from './controller'
import { CatRepository } from './repository'

@Module({
  imports: [TokenLibModule, LoggerModule, RedisCacheModule],
  controllers: [CatController],
  providers: [
    {
      provide: ICatRepository,
      useFactory: async (connection: Connection) => {
        type Model = mongoose.PaginateModel<CatDocument>

        const repository: MongoRepositoryModelSessionType<PaginateModel<CatDocument>> = connection.model<
          CatDocument,
          Model
        >(Cat.name, CatSchema as Schema)

        repository.connection = connection

        return new CatRepository(repository)
      },
      inject: [getConnectionToken(ConnectionName.CATS)]
    },
    {
      provide: ICatCreateAdapter,
      useFactory: (repository: ICatRepository) => new CatCreateUsecase(repository),
      inject: [ICatRepository]
    },
    {
      provide: ICatUpdateAdapter,
      useFactory: (logger: ILoggerAdapter, repository: ICatRepository) => new CatUpdateUsecase(repository, logger),
      inject: [ILoggerAdapter, ICatRepository]
    },
    {
      provide: ICatGetByIdAdapter,
      useFactory: (repository: ICatRepository) => new CatGetByIdUsecase(repository),
      inject: [ICatRepository]
    },
    {
      provide: ICatListAdapter,
      useFactory: (repository: ICatRepository) => new CatListUsecase(repository),
      inject: [ICatRepository]
    },
    {
      provide: ICatDeleteAdapter,
      useFactory: (repository: ICatRepository) => new CatDeleteUsecase(repository),
      inject: [ICatRepository]
    }
  ],
  exports: [
    ICatRepository,
    ICatCreateAdapter,
    ICatUpdateAdapter,
    ICatGetByIdAdapter,
    ICatListAdapter,
    ICatDeleteAdapter
  ]
})
export class CatModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthenticationMiddleware).forRoutes(CatController)
  }
}
```

---

## Complete Example: PostgreSQL

```typescript
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { IUserRepository } from '@/core/user/repository/user'
import { UserEntity } from '@/core/user/entity/user'
import { UserCreateUsecase } from '@/core/user/use-cases/user-create'
import { UserSchema } from '@/infra/database/postgres/schemas/user'
import { ILoggerAdapter, LoggerModule } from '@/infra/logger'
import { AuthenticationMiddleware } from '@/middlewares/middlewares'

import { IUserCreateAdapter } from './adapter'
import { UserController } from './controller'
import { UserRepository } from './repository'

@Module({
  imports: [
    LoggerModule,
    TypeOrmModule.forFeature([UserSchema])  // Standard TypeORM
  ],
  controllers: [UserController],
  providers: [
    {
      provide: IUserRepository,
      useFactory: (repository: Repository<UserSchema & UserEntity>) => {
        return new UserRepository(repository)
      },
      inject: [getRepositoryToken(UserSchema)]
    },
    {
      provide: IUserCreateAdapter,
      useFactory: (userRepository: IUserRepository, loggerService: ILoggerAdapter) => {
        return new UserCreateUsecase(userRepository, loggerService)
      },
      inject: [IUserRepository, ILoggerAdapter]
    }
    // ... other use cases
  ],
  exports: [IUserRepository, IUserCreateAdapter]
})
export class UserModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthenticationMiddleware).forRoutes(UserController)
  }
}
```

---

## Related Links

- [Adapter](./adapter.md) — Use case interface adapters
- [Controller](./controller.md) — HTTP entry point
- [Repository](./repository.md) — Repository implementation
- [Authentication Middleware](../middlewares/authentication.middleware.md) — Auth middleware
- [Database](../infra/database.md) — Database configuration
