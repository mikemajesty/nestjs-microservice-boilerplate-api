# Repository (Implementation)

The Repository in `modules/` is the **concrete implementation** of the abstract repository defined in `core/`. This is where database-specific code lives.

## Where Abstraction Becomes Real

```
Core (abstraction)                    →  Modules (implementation)
─────────────────────────────────────────────────────────────────
ICatRepository extends IRepository    →  CatRepository extends MongoRepository
IUserRepository extends IRepository   →  UserRepository extends TypeORMRepository
```

The Module then binds them together:

```typescript
// module.ts
{ provide: ICatRepository, useFactory: ... → new CatRepository(...) }
```

---

## Location & Naming Conventions

| Convention | Pattern | Example |
|------------|---------|---------|
| **Folder** | `src/modules/{domain}/` | `src/modules/cat/` |
| **File** | `repository.ts` | `repository.ts` |
| **Class** | `{Domain}Repository` | `CatRepository` |

---

## Mandatory: Extend the Generic Repository

**Every repository must extend** the appropriate generic repository:

```typescript
// MongoDB
export class CatRepository extends MongoRepository<CatDocument> implements ICatRepository

// PostgreSQL
export class UserRepository extends TypeORMRepository<Model> implements IUserRepository
```

This is **mandatory** because:
- Generic repositories provide all CRUD operations
- Consistent API across all repositories
- Only override what you need to customize

---

## MongoDB Repository

```typescript
import { Injectable } from '@nestjs/common'
import { PaginateModel } from 'mongoose'

import { CatEntity } from '@/core/cat/entity/cat'
import { ICatRepository } from '@/core/cat/repository/cat'
import { CatListInput, CatListOutput } from '@/core/cat/use-cases/cat-list'
import { Cat, CatDocument } from '@/infra/database/mongo/schemas/cat'
import { MongoRepository } from '@/infra/repository'
import { ConvertMongooseFilter, SearchTypeEnum, ValidateDatabaseSortAllowed } from '@/utils/decorators'
import { IEntity } from '@/utils/entity'
import { FilterQuery, MongoRepositoryModelSessionType } from '@/utils/mongoose'

@Injectable()
export class CatRepository extends MongoRepository<CatDocument> implements ICatRepository {
  constructor(readonly entity: MongoRepositoryModelSessionType<PaginateModel<CatDocument>>) {
    super(entity)
  }

  @ValidateDatabaseSortAllowed<CatEntity>({ name: 'createdAt' }, { name: 'breed' })
  @ConvertMongooseFilter<CatEntity>([
    { name: 'name', type: SearchTypeEnum.like },
    { name: 'breed', type: SearchTypeEnum.like },
    { name: 'age', type: SearchTypeEnum.equal, format: 'Number' }
  ])
  async paginate({ limit, page, search, sort }: CatListInput): Promise<CatListOutput> {
    const cats = await this.entity.paginate(search as FilterQuery<IEntity>, {
      page,
      limit,
      sort: sort as object
    })

    return {
      docs: cats.docs.map((u) => new CatEntity(u.toObject({ virtuals: true })).toObject()),
      limit,
      page,
      total: cats.totalDocs
    }
  }
}
```

**Key elements:**
- `extends MongoRepository<CatDocument>` — Generic Mongo operations
- `implements ICatRepository` — Core abstraction contract
- `MongoRepositoryModelSessionType` — Type with transaction support
- Constructor receives the Mongoose model

---

## PostgreSQL Repository

```typescript
import { Injectable } from '@nestjs/common'
import { Repository } from 'typeorm'

import { UserEntity } from '@/core/user/entity/user'
import { IUserRepository } from '@/core/user/repository/user'
import { UserListInput, UserListOutput } from '@/core/user/use-cases/user-list'
import { UserSchema } from '@/infra/database/postgres/schemas/user'
import { TypeORMRepository } from '@/infra/repository/postgres/repository'
import { ConvertTypeOrmFilter, SearchTypeEnum, ValidateDatabaseSortAllowed } from '@/utils/decorators'
import { PaginationUtils } from '@/utils/pagination'

@Injectable()
export class UserRepository extends TypeORMRepository<Model> implements IUserRepository {
  constructor(readonly repository: Repository<Model>) {
    super(repository)
  }

  @ConvertTypeOrmFilter<UserEntity>([
    { name: 'email', type: SearchTypeEnum.equal },
    { name: 'name', type: SearchTypeEnum.like }
  ])
  @ValidateDatabaseSortAllowed<UserEntity>({ name: 'email' }, { name: 'name' }, { name: 'createdAt' })
  async paginate(input: UserListInput): Promise<UserListOutput> {
    const skip = PaginationUtils.calculateSkip(input)

    const [docs, total] = await this.repository.findAndCount({
      take: input.limit,
      skip,
      order: input.sort as FindOptionsOrder<unknown>,
      where: input.search as FindOptionsWhere<unknown>
    })

    return { docs: docs as UserEntity[], limit: input.limit, page: input.page, total }
  }
}
```

**Key elements:**
- `extends TypeORMRepository<Model>` — Generic TypeORM operations
- `implements IUserRepository` — Core abstraction contract
- Constructor receives the TypeORM `Repository`

---

## Constructor Differences

| Database | Constructor Parameter | Type |
|----------|----------------------|------|
| **MongoDB** | `entity` | `MongoRepositoryModelSessionType<PaginateModel<Document>>` |
| **PostgreSQL** | `repository` | `Repository<Schema>` |

---

## Decorators for Pagination

### `@ValidateDatabaseSortAllowed`

Validates that only allowed fields can be used for sorting:

```typescript
@ValidateDatabaseSortAllowed<CatEntity>({ name: 'createdAt' }, { name: 'breed' })
async paginate(input: CatListInput): Promise<CatListOutput>
```

See [ValidateDatabaseSortAllowed](../decorators/validate-database-sort-allowed.md).

### `@ConvertMongooseFilter`

Converts search input to Mongoose query format:

```typescript
@ConvertMongooseFilter<CatEntity>([
  { name: 'name', type: SearchTypeEnum.like },
  { name: 'breed', type: SearchTypeEnum.like },
  { name: 'age', type: SearchTypeEnum.equal, format: 'Number' }
])
```

See [ConvertMongooseFilter](../decorators/convert-mongoose-filter.md).

### `@ConvertTypeOrmFilter`

Converts search input to TypeORM query format:

```typescript
@ConvertTypeOrmFilter<UserEntity>([
  { name: 'email', type: SearchTypeEnum.equal },
  { name: 'name', type: SearchTypeEnum.like }
])
```

See [ConvertTypeOrmFilter](../decorators/convert-typeorm-filter.md).

---

## Binding in Module

The Module binds the abstract `ICatRepository` to the concrete `CatRepository`:

```typescript
// MongoDB
{
  provide: ICatRepository,
  useFactory: async (connection: Connection) => {
    const repository = connection.model<CatDocument, Model>(Cat.name, CatSchema as Schema)
    repository.connection = connection
    return new CatRepository(repository)
  },
  inject: [getConnectionToken(ConnectionName.CATS)]
}

// PostgreSQL
{
  provide: IUserRepository,
  useFactory: (repository: Repository<UserSchema & UserEntity>) => {
    return new UserRepository(repository)
  },
  inject: [getRepositoryToken(UserSchema)]
}
```

See [Module](./module.md) for full details.

---

## Related Links

- [Repository (Core)](../core/repository.md) — Abstract interface
- [Module](./module.md) — Where binding happens
- [MongoRepository](../infra/repository.md) — Generic MongoDB repository
- [TypeORMRepository](../infra/repository.md) — Generic PostgreSQL repository
- [ValidateDatabaseSortAllowed](../decorators/validate-database-sort-allowed.md) — Sort validation
- [ConvertMongooseFilter](../decorators/convert-mongoose-filter.md) — Mongoose filter conversion
- [ConvertTypeOrmFilter](../decorators/convert-typeorm-filter.md) — TypeORM filter conversion
