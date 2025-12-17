# ConvertMongooseFilter Decorator (Repository Layer)

Transforms **manual, complex MongoDB query construction** into elegant, type-safe, automatic filter validation and query generation for **Repository layer** with built-in regex optimization, case-insensitive search, and MongoDB-specific operators.

> **Note:** This decorator is different from `ConvertMongoFilterToBaseRepository` (see [convert-mongoose-filter.md](convert-mongoose-filter.md)). Use **ConvertMongooseFilter** in Module Repositories (builds $or/$and queries) and **ConvertMongoFilterToBaseRepository** in Base Repository/Infra (flattens nested objects).

## The Problem: Manual MongoDB Filter Construction in Repositories

### ❌ **Without ConvertMongooseFilter - Manual Nightmare**

```typescript
// UGLY: Manual MongoDB query construction at repository level
export class CatRepository {
  async paginate(input: CatListInput): Promise<CatListOutput> {
    const allowedFilterFields = ['name', 'breed', 'age']
    const where: FilterQuery<CatDocument> = { 
      $or: [],
      $and: [],
      deletedAt: null
    }
    
    if (input.search) {
      // ❌ Manual validation - error prone!
      Object.keys(input.search).forEach(key => {
        if (!allowedFilterFields.includes(key)) {
          throw new Error(`Filter '${key}' not allowed`)
        }
      })
      
      // ❌ Manual ID handling
      if (input.search.id) {
        where._id = input.search.id
        delete input.search.id
      }
      
      // ❌ Manual regex construction for LIKE searches
      if (input.search.name) {
        if (Array.isArray(input.search.name)) {
          where.$or?.push(...input.search.name.map(name => ({
            name: { $regex: escapeRegex(name), $options: 'i' }
          })))
        } else {
          where.$and?.push({
            name: { $regex: escapeRegex(input.search.name), $options: 'i' }
          })
        }
      }
      
      // ❌ Manual age filtering with type conversion
      if (input.search.age) {
        if (Array.isArray(input.search.age)) {
          where.$or?.push(...input.search.age.map(age => ({ age: Number(age) })))
        } else {
          where.$and?.push({ age: Number(input.search.age) })
        }
      }
      
      // ❌ Manual cleanup
      if (!where.$or?.length) delete where.$or
      if (!where.$and?.length) delete where.$and
    }
    
    input.search = where
    return this.repository.paginate(input)
  }
}
```

**Problems:**
- 🚨 Manual filter validation for each field
- 🔄 Repeated regex construction logic
- 💀 Type conversion errors (string to number)
- 📋 Verbose $or/$and operator handling
- ⚠️ ID to _id conversion forgotten

---

## The Solution: ConvertMongooseFilter Decorator

### ✅ **With ConvertMongooseFilter - Clean & Type-Safe**

```typescript
import { ConvertMongooseFilter, SearchTypeEnum } from '@/utils/decorators'

export class CatRepository {
  @ConvertMongooseFilter<CatEntity>([
    { name: 'name', type: SearchTypeEnum.like },
    { name: 'breed', type: SearchTypeEnum.like },
    { name: 'age', type: SearchTypeEnum.equal, format: 'number' }
  ])
  async paginate(input: CatListInput): Promise<CatListOutput> {
    // ✅ Filters already validated and converted to MongoDB query!
    const cats = await this.entity.paginate(input.search, { page: input.page, limit: input.limit })
    return { docs: cats.docs, total: cats.totalDocs, page: input.page, limit: input.limit }
  }
}
```

**That's it!** The decorator:
- ✅ Validates allowed filters automatically
- ✅ Converts `id` → `_id` for MongoDB
- ✅ Builds `$or`/`$and` operators correctly
- ✅ Applies regex with case-insensitive search for `like`
- ✅ Converts types automatically (string → number, UUID, etc.)

---

## Configuration Options

```typescript
interface AllowedFilter<T> {
  name: keyof T           // Field name from entity
  type: SearchTypeEnum    // 'like' (regex) or 'equal' (exact match)
  map?: string            // Map to different field name
  format?: 'number' | 'uuid' | 'boolean'  // Auto type conversion
}
```

### Search Types

| Type | Description | MongoDB Operator |
|------|-------------|------------------|
| `SearchTypeEnum.like` | Partial match (regex) | `{ $regex: value, $options: 'i' }` |
| `SearchTypeEnum.equal` | Exact match | `{ field: value }` |

---

## Real-World Examples

### Example 1: User Search with Multiple Filters

```typescript
export class UserRepository {
  @ConvertMongooseFilter<UserEntity>([
    { name: 'name', type: SearchTypeEnum.like },
    { name: 'email', type: SearchTypeEnum.like },
    { name: 'status', type: SearchTypeEnum.equal },
    { name: 'age', type: SearchTypeEnum.equal, format: 'number' }
  ])
  async paginate(input: UserListInput): Promise<UserListOutput> {
    return this.entity.paginate(input.search, { page: input.page, limit: input.limit })
  }
}
```

**Input:**
```json
{
  "search": {
    "name": "john",
    "status": "active"
  }
}
```

**Generated MongoDB Query:**
```javascript
{
  "$and": [
    { "name": { "$regex": "john", "$options": "i" } },
    { "status": "active" }
  ],
  "deletedAt": null
}
```

### Example 2: Multiple Values (OR condition)

```typescript
export class ProductRepository {
  @ConvertMongooseFilter<ProductEntity>([
    { name: 'category', type: SearchTypeEnum.equal },
    { name: 'brand', type: SearchTypeEnum.like }
  ])
  async paginate(input: ProductListInput): Promise<ProductListOutput> {
    return this.entity.paginate(input.search, { page: input.page, limit: input.limit })
  }
}
```

**Input:**
```json
{
  "search": {
    "category": ["electronics", "computers"],
    "brand": "apple"
  }
}
```

**Generated MongoDB Query:**
```javascript
{
  "$or": [
    { "category": "electronics" },
    { "category": "computers" }
  ],
  "$and": [
    { "brand": { "$regex": "apple", "$options": "i" } }
  ],
  "deletedAt": null
}
```

### Example 3: Field Mapping

```typescript
export class OrderRepository {
  @ConvertMongooseFilter<OrderEntity>([
    { name: 'customer', type: SearchTypeEnum.like, map: 'customer.name' },
    { name: 'total', type: SearchTypeEnum.equal, format: 'number' }
  ])
  async paginate(input: OrderListInput): Promise<OrderListOutput> {
    return this.entity.paginate(input.search, { page: input.page, limit: input.limit })
  }
}
```

---

## Difference from ConvertMongoFilterToBaseRepository

| Decorator | Layer | Purpose |
|-----------|-------|---------|
| **ConvertMongooseFilter** | Module Repository | Validates filters, builds $or/$and, applies regex |
| **ConvertMongoFilterToBaseRepository** | Base Repository (Infra) | Flattens nested objects, handles id→_id |

**Use both together:**

```typescript
// Module Repository - validates and builds query
export class CatRepository {
  @ConvertMongooseFilter<CatEntity>([...])
  async paginate(input) { ... }
}

// Base Repository (Infra) - normalizes for MongoDB
export class MongoRepository {
  @ConvertMongoFilterToBaseRepository()
  async find(filter) { ... }
}

---

## Error Handling

When an invalid filter is provided:

```typescript
// Request with invalid filter
{ "search": { "invalidField": "value" } }

// Throws ApiBadRequestException:
// "filter invalidField not allowed, allowed list: name, breed, age"
```

---

## Summary

| Feature | Before | After |
|---------|--------|-------|
| Filter Validation | ~15 lines manual | Declarative array |
| Regex Construction | Manual escaping | Automatic |
| Type Conversion | Error-prone casting | Format option |
| $or/$and Handling | Manual push/cleanup | Automatic |
| ID Conversion | Often forgotten | Automatic |

**ConvertMongooseFilter** - *MongoDB query construction that just works.*
