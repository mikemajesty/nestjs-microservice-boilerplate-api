# Repository

A **database-agnostic repository layer** that provides a unified interface for both MongoDB and PostgreSQL. Write your business logic once, switch databases without changing a single line of application core.

## The Database Lock-in Problem

Without a unified repository interface, your application becomes **tightly coupled** to a specific database:

```typescript
// ❌ PROBLEM: Business logic tied to MongoDB
@Injectable()
export class UserService {
  constructor(@InjectModel('User') private userModel: Model<UserDocument>) {}

  async findActiveUsers() {
    // MongoDB-specific query syntax
    return this.userModel
      .find({
        status: 'active',
        deletedAt: null
      })
      .select('-password')
  }

  async updateUser(id: string, data: UpdateUserDTO) {
    // MongoDB-specific update syntax
    return this.userModel.updateOne({ _id: id }, { $set: data })
  }
}

// 😫 What if you need to migrate to PostgreSQL?
// - Rewrite ALL repository calls
// - Change ALL query syntax
// - Risk introducing bugs everywhere
```

## The Solution: Single Interface, Multiple Implementations

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        REPOSITORY ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                      ┌─────────────────────────┐                            │
│                      │   IRepository<T>        │                            │
│                      │   (adapter.ts)          │                            │
│                      │                         │                            │
│                      │   • create()            │                            │
│                      │   • findById()          │                            │
│                      │   • findOne()           │                            │
│                      │   • findAll()           │                            │
│                      │   • updateOne()         │                            │
│                      │   • remove()            │                            │
│                      │   • ...20+ methods      │                            │
│                      └───────────┬─────────────┘                            │
│                                  │                                          │
│                    ┌─────────────┴─────────────┐                            │
│                    │         implements        │                            │
│                    ▼                           ▼                            │
│     ┌──────────────────────────┐  ┌──────────────────────────┐             │
│     │    MongoRepository<T>    │  │   TypeORMRepository<T>   │             │
│     │    (mongo/repository.ts) │  │   (postgres/repository)  │             │
│     │                          │  │                          │             │
│     │  Translates to:          │  │  Translates to:          │             │
│     │  • $set, $in, $or        │  │  • TypeORM syntax        │             │
│     │  • .populate()           │  │  • .leftJoinAndSelect()  │             │
│     │  • _id handling          │  │  • relations handling    │             │
│     └──────────────────────────┘  └──────────────────────────┘             │
│                    │                           │                            │
│                    ▼                           ▼                            │
│              ┌──────────┐               ┌──────────┐                        │
│              │ MongoDB  │               │ Postgres │                        │
│              └──────────┘               └──────────┘                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## The Power of Abstraction

### Your Business Logic Stays Clean

```typescript
// src/core/cat/repository/cat.ts - Abstract interface in core
export abstract class ICatRepository extends IRepository<CatEntity> {
  abstract paginate(input: CatListInput): Promise<CatListOutput>
}

// src/core/cat/use-cases/cat-list.ts - Use case uses ONLY the interface
export class CatListUsecase {
  constructor(private readonly catRepository: ICatRepository) {}

  execute(input: CatListInput): Promise<CatListOutput> {
    return this.catRepository.paginate(input) // Database-agnostic!
  }
}

// src/core/cat/use-cases/cat-get-by-id.ts
export class CatGetByIdUsecase {
  constructor(private readonly catRepository: ICatRepository) {}

  execute(id: string): Promise<CatEntity | null> {
    return this.catRepository.findById(id) // Inherited from IRepository
  }
}
```

The use cases **never know** which database is being used. They only depend on the abstract `ICatRepository`, which could be backed by MongoDB, PostgreSQL, or any other database.

### Switch Databases Without Code Changes

The pattern involves 3 layers:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         REPOSITORY PATTERN                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. CORE LAYER (src/core/{entity}/repository/)                             │
│     ┌─────────────────────────────────────────────────────────────────┐    │
│     │  abstract class ICatRepository extends IRepository<CatEntity>   │    │
│     │    abstract paginate(input): Promise<CatListOutput>             │    │
│     └─────────────────────────────────────────────────────────────────┘    │
│                                    │                                        │
│                                    │ extends                                │
│                                    ▼                                        │
│  2. MODULE LAYER (src/modules/{entity}/repository.ts)                      │
│     ┌─────────────────────────────────────────────────────────────────┐    │
│     │  class CatRepository                                            │    │
│     │    extends MongoRepository<CatDocument>  ◄── Database specific  │    │
│     │    implements ICatRepository                                    │    │
│     └─────────────────────────────────────────────────────────────────┘    │
│                                    │                                        │
│                                    │ injected via                           │
│                                    ▼                                        │
│  3. MODULE DI (src/modules/{entity}/module.ts)                             │
│     ┌─────────────────────────────────────────────────────────────────┐    │
│     │  { provide: ICatRepository, useFactory: ... }                   │    │
│     └─────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Step 1: Core Repository Interface (Database Agnostic)

```typescript
// src/core/cat/repository/cat.ts
import { IRepository } from '@/infra/repository'
import { CatEntity } from '../entity/cat'
import { CatListInput, CatListOutput } from '../use-cases/cat-list'

export abstract class ICatRepository extends IRepository<CatEntity> {
  abstract paginate(input: CatListInput): Promise<CatListOutput>
}
```

#### Step 2a: MongoDB Implementation

```typescript
// src/modules/cat/repository.ts
@Injectable()
export class CatRepository extends MongoRepository<CatDocument, CatEntity> implements ICatRepository {
  constructor(@InjectModel(Cat.name) readonly entity: MongoRepositoryModelSessionType<PaginateModel<CatDocument>>) {
    super(entity, CatEntity)
  }

  @TransformSort<CatEntity>({ name: 'createdAt' }, { name: 'breed' })
  @TransformMongooseSearch<CatEntity>([
    { name: 'name', type: SearchTypeEnum.like },
    { name: 'breed', type: SearchTypeEnum.like },
    { name: 'age', type: SearchTypeEnum.equal, format: 'Number' }
  ])
  async paginate(input: CatListInput): Promise<CatListOutput> {
    return this.applyPagination(input)
  }
}
```

```typescript
// src/modules/cat/module.ts
{
  provide: ICatRepository,
  useFactory: async (connection: Connection) => {
    type Model = mongoose.PaginateModel<CatDocument>
    const repository: MongoRepositoryModelSessionType<PaginateModel<CatDocument>> =
      connection.model<CatDocument, Model>(Cat.name, CatSchema as Schema)
    repository.connection = connection
    return new CatRepository(repository)
  },
  inject: [getConnectionToken(ConnectionName.CATS)]
}
```

#### Step 2b: PostgreSQL Implementation

```typescript
// src/modules/role/repository.ts
@Injectable()
export class RoleRepository extends TypeORMRepository<Model, RoleEntity> implements IRoleRepository {
  constructor(readonly repository: Repository<Model>) {
    super(repository, RoleEntity)
  }

  @TransformTypeOrmSearch<RoleEntity>([{ name: 'name', type: SearchTypeEnum.like }])
  @TransformSort<RoleEntity>({ name: 'name' }, { name: 'createdAt' })
  async paginate(input: RoleListInput): Promise<RoleListOutput> {
    return this.applyPagination(input)
  }
}

type Model = RoleSchema & RoleEntity
```

```typescript
// src/modules/role/module.ts
{
  provide: IRoleRepository,
  useFactory: (repository: Repository<RoleSchema & RoleEntity>) => {
    return new RoleRepository(repository)
  },
  inject: [getRepositoryToken(RoleSchema)]
}
```

#### Use Cases Stay Clean (Zero Database Knowledge)

```typescript
// src/core/cat/use-cases/cat-list.ts
export class CatListUsecase {
  constructor(private readonly catRepository: ICatRepository) {}

  execute(input: CatListInput): Promise<CatListOutput> {
    return this.catRepository.paginate(input) // Works with Mongo or Postgres!
  }
}
```

**To switch databases:** Only change the module's repository implementation. Use cases, controllers, and all business logic remain untouched! 🎉

## IRepository Interface

The abstract class that defines **all available operations**:

```typescript
abstract class IRepository<T> {
  // Create
  abstract create(document: T, options?): Promise<CreatedModel>
  abstract createOrUpdate(document: T, options?): Promise<CreatedOrUpdateModel>
  abstract insertMany(documents: T[], options?): Promise<void>

  // Read - Basic
  abstract findById(id: string | number, options?): Promise<T | null>
  abstract findOne(filter, options?): Promise<T | null>
  abstract findAll(filter?, options?): Promise<T[]>
  abstract find(filter, options?): Promise<T[]>

  // Read - Advanced
  abstract findIn(filter, options?): Promise<T[]>
  abstract findOr(propertyList, value, options?): Promise<T[]>
  abstract findByCommands(filterList, options?): Promise<T[]>
  abstract findOneByCommands(filterList, options?): Promise<T | null>

  // Read - Field Selection
  abstract findOneWithExcludeFields(filter, excludeFields, options?): Promise<T | null>
  abstract findAllWithExcludeFields(excludeFields, filter?, options?): Promise<T[]>
  abstract findOneWithSelectFields(filter, includeFields, options?): Promise<T | null>
  abstract findAllWithSelectFields(includeFields, filter?, options?): Promise<T[]>

  // Read - Joins/Relations
  abstract findOneWithJoin(filter, joins?): Promise<T | null>
  abstract findAllWithJoin(filter?, joins?): Promise<T[]>

  // Update
  abstract updateOne(filter, updated, options?): Promise<UpdatedModel>
  abstract updateMany(filter, updated, options?): Promise<UpdatedModel>
  abstract findOneAndUpdate(filter, updated, options?): Promise<T | null>

  // Delete
  abstract remove(filter, options?): Promise<RemovedModel>
}
```

## Method Reference

### Create Operations

#### `create(document, options?)`

Creates a single document and returns its ID.

```typescript
const result = await this.userRepository.create({
  id: IdGeneratorUtils.uuid(),
  name: 'John Doe',
  email: 'john@example.com'
})

// result: { id: 'abc-123', created: true }
```

#### `createOrUpdate(document, options?)`

Creates if doesn't exist, updates if exists. **Requires `id` field.**

```typescript
// First call - creates
const result1 = await this.userRepository.createOrUpdate({
  id: 'user-123',
  name: 'John',
  status: 'active'
})
// result1: { id: 'user-123', created: true, updated: false }

// Second call - updates
const result2 = await this.userRepository.createOrUpdate({
  id: 'user-123',
  name: 'John Updated',
  status: 'inactive'
})
// result2: { id: 'user-123', created: false, updated: true }
```

#### `insertMany(documents, options?)`

Bulk insert for performance. Returns void.

```typescript
await this.userRepository.insertMany([
  { id: '1', name: 'User 1', email: 'user1@example.com' },
  { id: '2', name: 'User 2', email: 'user2@example.com' },
  { id: '3', name: 'User 3', email: 'user3@example.com' }
])
```

### Read Operations - Basic

#### `findById(id, options?)`

Find single document by ID.

```typescript
const user = await this.userRepository.findById('user-123')
// user: UserEntity | null
```

#### `findOne(filter, options?)`

Find single document matching filter.

```typescript
const user = await this.userRepository.findOne({ email: 'john@example.com' })
```

#### `find(filter, options?)`

Find all documents matching filter.

```typescript
const activeUsers = await this.userRepository.find({ status: 'active' })
```

#### `findAll(filter?, options?)`

Find all documents, optionally filtered.

```typescript
// All users
const allUsers = await this.userRepository.findAll()

// Filtered
const admins = await this.userRepository.findAll({ role: 'admin' })
```

### Read Operations - Advanced

#### `findIn(filter, options?)`

Find documents where field value is IN a list.

```typescript
const users = await this.userRepository.findIn({
  id: ['user-1', 'user-2', 'user-3']
})

// Equivalent SQL: WHERE id IN ('user-1', 'user-2', 'user-3')
// Equivalent Mongo: { _id: { $in: [...] } }
```

#### `findOr(propertyList, value, options?)`

Find documents where ANY of the properties matches the value.

```typescript
const users = await this.userRepository.findOr(['email', 'username', 'phone'], 'john@example.com')

// Finds user where email='john@example.com'
// OR username='john@example.com'
// OR phone='john@example.com'
```

#### `findByCommands(filterList, options?)`

Advanced filtering with operators: `equal`, `not_equal`, `contains`, `not_contains`.

```typescript
const users = await this.userRepository.findByCommands([
  { property: 'status', value: ['active', 'pending'], command: DatabaseOperationEnum.EQUAL },
  { property: 'name', value: ['admin', 'test'], command: DatabaseOperationEnum.NOT_CONTAINS }
])

// Finds users where:
// - status IN ('active', 'pending')
// - name NOT LIKE '%admin%' AND name NOT LIKE '%test%'
```

#### `findOneByCommands(filterList, options?)`

Same as `findByCommands` but returns single result.

```typescript
const user = await this.userRepository.findOneByCommands([
  { property: 'email', value: ['john@'], command: DatabaseOperationEnum.CONTAINS }
])
```

### Read Operations - Field Selection

#### `findOneWithExcludeFields(filter, excludeFields, options?)`

Find one document, excluding specific fields from result.

```typescript
// Get user without sensitive fields
const user = await this.userRepository.findOneWithExcludeFields({ id: 'user-123' }, [
  'password',
  'refreshToken',
  'resetPasswordToken'
])

// user.password = undefined (not included in result)
```

#### `findAllWithExcludeFields(excludeFields, filter?, options?)`

Find all documents, excluding specific fields.

```typescript
const users = await this.userRepository.findAllWithExcludeFields(['password', 'internalNotes'], { status: 'active' })
```

#### `findOneWithSelectFields(filter, includeFields, options?)`

Find one document, selecting ONLY specific fields.

```typescript
// Get only id and email
const user = await this.userRepository.findOneWithSelectFields({ id: 'user-123' }, ['id', 'email', 'name'])

// user = { id: 'user-123', email: '...', name: '...' }
```

## Pagination Pattern with `applyPagination`

To ensure consistent and validated pagination across all repositories, every repository implementation must provide an `applyPagination` method. This method is responsible for handling pagination logic in a database-agnostic way, returning a standardized output regardless of the underlying database.

**Usage:**

- Implement `applyPagination` in every repository (MongoDB, PostgreSQL, etc.), following the interface contract and using `async`.
- Always use the appropriate decorators (e.g., `@TransformMongooseSearch`, `@TransformTypeOrmSearch`, `@TransformSort`) on your pagination methods to ensure filters and sorting are correctly handled for each database.
- Pass the domain entity constructor to the generic repository. Every complete read is then hydrated automatically and returned as a domain entity instance.

**Example (MongoDB):**

```typescript
@TransformSort<CatEntity>({ name: 'createdAt' }, { name: 'breed' })
@TransformMongooseSearch<CatEntity>([
  { name: 'name', type: SearchTypeEnum.like },
  { name: 'breed', type: SearchTypeEnum.like },
  { name: 'age', type: SearchTypeEnum.equal, format: 'Number' }
])
async paginate(input: CatListInput): Promise<CatListOutput> {
  return this.applyPagination(input)
}
```

**Example (PostgreSQL/TypeORM):**

```typescript
@TransformTypeOrmSearch<RoleEntity>([{ name: 'name', type: SearchTypeEnum.like }])
@TransformSort<RoleEntity>({ name: 'name' }, { name: 'createdAt' })
async paginate(input: RoleListInput): Promise<RoleListOutput> {
  return this.applyPagination(input)
}
```

---

## Existence Methods: `exists` and `existsOnUpdate`

To simplify existence checks and uniqueness validation, the repository interface includes two methods:

### `exists`

Checks if any record exists matching the filter.  
Returns only `true` or `false`, never throws.

**Example:**

```typescript
const exists = await userRepository.exists({ email: 'test@email.com' })
if (exists) {
  // Handle existence
}
```

### `existsOnUpdate`

Checks if any other record exists matching the filter, ignoring the given id.  
Useful for uniqueness validation on update (e.g., avoid duplicate emails).

**Example:**

```typescript
const exists = await userRepository.existsOnUpdate({ email: 'test@email.com' }, userId)
if (exists) {
  // Handle conflict
}
```

**Implementation Notes:**

- Both methods are available for MongoDB and PostgreSQL repositories.
- Always return a boolean, never throw errors.
- `existsOnUpdate` ignores the current record by id, ideal for update scenarios.

#### `findAllWithSelectFields(includeFields, filter?, options?)`

Find all documents, selecting ONLY specific fields.

```typescript
// Lightweight list for dropdown
const users = await this.userRepository.findAllWithSelectFields(['id', 'name'], { status: 'active' })
```

### Read Operations - Joins/Relations

#### `findOneWithJoin(filter, joins?)`

Find one document with related entities populated.

```typescript
// Define which relations to load
const user = await this.userRepository.findOneWithJoin({ id: 'user-123' }, { roles: true, permissions: true })

// user.roles = [RoleEntity, RoleEntity, ...]
// user.permissions = [PermissionEntity, ...]
```

#### `findAllWithJoin(filter?, joins?)`

Find all documents with relations.

```typescript
const users = await this.userRepository.findAllWithJoin({ status: 'active' }, { roles: true })
```

### Update Operations

#### `updateOne(filter, updated, options?)`

Update single document matching filter.

```typescript
const result = await this.userRepository.updateOne({ id: 'user-123' }, { status: 'inactive', updatedAt: new Date() })

// result: { matchedCount: 1, modifiedCount: 1, acknowledged: true, ... }
```

#### `updateMany(filter, updated, options?)`

Update all documents matching filter.

```typescript
const result = await this.userRepository.updateMany(
  { status: 'pending', createdAt: { $lt: thirtyDaysAgo } },
  { status: 'expired' }
)

// result: { matchedCount: 150, modifiedCount: 150, ... }
```

#### `findOneAndUpdate(filter, updated, options?)`

Update and return the updated document.

```typescript
const user = await this.userRepository.findOneAndUpdate({ id: 'user-123' }, { lastLoginAt: new Date() })

// user = updated UserEntity (with new lastLoginAt)
```

### Delete Operations

#### `remove(filter, options?)`

Delete documents matching filter.

```typescript
const result = await this.userRepository.remove({ id: 'user-123' })

// result: { deletedCount: 1, deleted: true }
```

## Return Types

| Type                   | Fields                                                                         | Description                |
| ---------------------- | ------------------------------------------------------------------------------ | -------------------------- |
| `CreatedModel`         | `id`, `created`                                                                | Result of create operation |
| `CreatedOrUpdateModel` | `id`, `created`, `updated`                                                     | Result of upsert operation |
| `UpdatedModel`         | `matchedCount`, `modifiedCount`, `acknowledged`, `upsertedId`, `upsertedCount` | Result of update operation |
| `RemovedModel`         | `deletedCount`, `deleted`                                                      | Result of delete operation |

## DatabaseOperationCommand

For advanced filtering with `findByCommands` and `findOneByCommands`:

```typescript
type DatabaseOperationCommand<T> = {
  property: keyof T      // Field to filter
  value: unknown[]       // Values to match
  command: DatabaseOperationEnum  // Operation type
}

enum DatabaseOperationEnum {
  EQUAL = 'equal'           // IN (exact match)
  NOT_EQUAL = 'not_equal'   // NOT IN
  CONTAINS = 'contains'     // LIKE %value%
  NOT_CONTAINS = 'not_contains'  // NOT LIKE %value%
}
```

## Transaction Operations

### `runInTransaction(fn)`

Executes multiple operations in a single transaction. The callback receives the transaction context (session for MongoDB, manager for TypeORM).

#### MongoDB Example

```typescript
await this.userRepository.runInTransaction(async (session) => {
  await this.userRepository.create(
    {
      id: IdGeneratorUtils.uuid(),
      name: 'John Doe',
      email: 'john@example.com'
    },
    { session }
  )
  await this.userRepository.updateOne({ id: 'user-123' }, { status: 'active' }, { session })
  // ...other operations
})
```

#### TypeORM Example

```typescript
await this.userRepository.runInTransaction(async (manager) => {
  await manager.save(UserEntity, {
    id: IdGeneratorUtils.uuid(),
    name: 'John Doe',
    email: 'john@example.com'
  })
  await manager.update(UserEntity, { id: 'user-123' }, { status: 'active' })
  // ...other operations
})
```

### PostgreSQL query timeout example

PostgreSQL timeout configuration is session-scoped, unlike MongoDB's
per-command `maxTimeMS`. Do not add a timeout method to `IRepository` unless
both database implementations can provide the same guarantee.

[`UserRepository`](../../src/modules/user/repository.ts) contains an optional
example that can be adapted by a PostgreSQL repository that needs a
server-enforced timeout:

```typescript
await this.userRepository.withDeadline(800, async (repository) => {
  return repository.findById(userId)
})
```

It creates a short transaction on one `QueryRunner` connection, applies
`SET LOCAL statement_timeout`, and invokes the concrete repository bound to
that connection. The timeout applies to each SQL statement in the callback and
does not leak to the connection pool. Keep it specific to the repository and
operation that need the protection.

## Automatic Soft Delete Handling

Both implementations automatically filter out soft-deleted records:

```typescript
// Your code
const users = await this.userRepository.findAll({ status: 'active' })

// MongoDB translation
db.users.find({ status: 'active', deletedAt: null })

// PostgreSQL translation
SELECT * FROM users WHERE status = 'active' AND deleted_at IS NULL
```

## Automatic ID Normalization (MongoDB)

MongoDB uses `_id`, but your entities use `id`. The repository handles this automatically:

```typescript
// Your code
const user = await this.userRepository.findOne({ id: 'user-123' })

// MongoDB translation (automatic)
db.users.findOne({ _id: 'user-123' })
```

## Decorator Integration

The MongoRepository uses decorators for automatic filter conversion:

```typescript
@NormalizeMongoFilter()
async find(filter, options): Promise<T[]> {
  // Filter is automatically converted from { id: '123' } to { _id: '123' }
  // deletedAt: null is automatically added
}
```

## Related

- [@NormalizeMongoFilter](../decorators/convert-mongoose-filter.md) — Auto filter conversion
- [@TransformTypeOrmSearch](../decorators/convert-typeorm-filter.md) — TypeORM search conversion in module repositories
- [Entity](../utils/entity.md) — Base entity interface
- [Pagination](../utils/pagination.md) — Pagination utilities
