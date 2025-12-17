# ConvertMongoFilterToBaseRepository Decorator (Base Repository / Infra Layer)

Transforms **nested filter objects** into **flattened MongoDB-compatible queries** for base repository operations, with automatic `id` → `_id` conversion and soft delete handling.

> **Note:** This decorator is different from `ConvertMongooseFilter` (see [validate-mongoose-filter.md](validate-mongoose-filter.md)). Use **ConvertMongooseFilter** in Module Repositories (builds $or/$and queries) and **ConvertMongoFilterToBaseRepository** in Base Repository/Infra (flattens nested objects).

## The Problem: Nested Filter Objects in Repositories

### ❌ **Without ConvertMongoFilterToBaseRepository**

```typescript
export class CatRepository {
  async findOne(filter: FilterQuery<CatEntity>): Promise<CatEntity | null> {
    // ❌ Manual nested object flattening
    const flatFilter = {}
    
    // ❌ Manual id → _id conversion
    if (filter.id) {
      flatFilter._id = filter.id
      delete filter.id
    }
    
    // ❌ Manual nested object handling
    // Input: { owner: { name: 'John' } }
    // Output: { 'owner.name': 'John' }
    const flattenKeys = (obj, target, prefix = '') => {
      for (const key in obj) {
        const value = obj[key]
        const fullKey = prefix ? `${prefix}.${key}` : key
        
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          flattenKeys(value, target, fullKey)
          continue
        }
        target[fullKey] = value
      }
    }
    flattenKeys(filter, flatFilter)
    
    // ❌ Manual soft delete addition
    flatFilter.deletedAt = null
    
    return this.entity.findOne(flatFilter)
  }
}
```

**Problems:**
- 🚨 Manual flattening of nested objects
- 🔄 Repeated `id` → `_id` conversion logic
- 💀 Soft delete handling easily forgotten
- 📋 Verbose code in every repository method

---

## The Solution: ConvertMongoFilterToBaseRepository Decorator

### ✅ **With ConvertMongoFilterToBaseRepository - Clean & Automatic**

```typescript
import { ConvertMongoFilterToBaseRepository } from '@/utils/decorators'

export class CatRepository {
  @ConvertMongoFilterToBaseRepository()
  async findOne(filter: FilterQuery<CatEntity>): Promise<CatEntity | null> {
    // ✅ Filters already flattened and normalized!
    return this.entity.findOne(filter)
  }
}
```

**That's it!** The decorator automatically:
- ✅ Converts `id` → `_id` for MongoDB
- ✅ Flattens nested objects (e.g., `owner.name` → `'owner.name'`)
- ✅ Adds `deletedAt: null` for soft delete handling

---

## How It Works

### Input → Output Transformation

```typescript
// Before decorator
const input = {
  id: '507f1f77bcf86cd799439011',
  owner: {
    name: 'John',
    age: 30
  },
  status: 'active'
}

// After ConvertMongoFilterToBaseRepository
const output = {
  _id: '507f1f77bcf86cd799439011',  // id → _id
  'owner.name': 'John',              // Flattened
  'owner.age': 30,                   // Flattened
  status: 'active',
  deletedAt: null                    // Soft delete
}
```

---

## Real-World Examples

### Example 1: Simple Find

```typescript
export class UserRepository {
  @ConvertMongoFilterToBaseRepository()
  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.entity.findOne({ email })
  }
}
```

### Example 2: Nested Object Filter

```typescript
export class OrderRepository {
  @ConvertMongoFilterToBaseRepository()
  async findByCustomer(filter: OrderFilter): Promise<OrderEntity[]> {
    // Input: { customer: { city: 'NYC', country: 'USA' } }
    // Transformed: { 'customer.city': 'NYC', 'customer.country': 'USA', deletedAt: null }
    return this.entity.find(filter)
  }
}
```

### Example 3: Combined with ConvertMongooseFilter

```typescript
// Use Case - validates and builds $or/$and query
export class CatListUsecase {
  @ConvertMongooseFilter<CatEntity>([
    { name: 'name', type: SearchTypeEnum.like },
    { name: 'breed', type: SearchTypeEnum.equal }
  ])
  async execute(input: CatListInput): Promise<CatListOutput> {
    return this.repository.paginate(input)
  }
}

// Repository - normalizes for MongoDB base operations
export class CatRepository {
  @ConvertMongoFilterToBaseRepository()
  async paginate(input: CatListInput): Promise<CatListOutput> {
    // Receives already processed query from ConvertMongooseFilter
    return this.entity.paginate(input.search)
  }
}
```

---

## Comparison with ConvertMongooseFilter

| Feature | ConvertMongooseFilter | ConvertMongoFilterToBaseRepository |
|---------|----------------------|-----------------------------------|
| **Layer** | Use Case | Repository |
| **Purpose** | Build $or/$and queries | Flatten nested objects |
| **Regex** | ✅ Creates regex for LIKE | ❌ No regex handling |
| **Type Conversion** | ✅ number, uuid, boolean | ❌ No conversion |
| **Filter Validation** | ✅ Whitelisting | ❌ No validation |
| **id → _id** | ✅ | ✅ |
| **Soft Delete** | ✅ | ✅ |
| **Nested Flattening** | ❌ | ✅ |

**Use both together for complete MongoDB query handling:**

```
Request → Use Case (ConvertMongooseFilter) → Repository (ConvertMongoFilterToBaseRepository) → MongoDB
```

---

## Summary

| Feature | Before | After |
|---------|--------|-------|
| Nested Object Flattening | ~15 lines | Automatic |
| id → _id Conversion | Manual | Automatic |
| Soft Delete | Often forgotten | Automatic |
| Code per method | ~20 lines | 1 decorator |

**ConvertMongoFilterToBaseRepository** - *Simple, automatic filter normalization for MongoDB repositories.*