# ValidateDatabaseSortAllowed Decorator

Transforms **manual, error-prone sorting validation** into elegant, type-safe, automatic sort object generation for repository pagination methods. This decorator ensures only **whitelisted properties** can be used for sorting and automatically **maps** them to the correct database field names.

## The Problem: Manual Sorting Validation Hell

### ❌ **Without ValidateDatabaseSortAllowed - Manual Nightmare**

```typescript
// UGLY: Manual sorting validation and mapping
export class UserRepository {
  async paginate(input: UserListInput): Promise<UserListOutput> {
    // ❌ Manual validation - error prone!
    const allowedSortFields = ['email', 'name', 'createdAt']
    const sort: { [key: string]: SortEnum } = {}
    
    if (input.sort) {
      Object.keys(input.sort).forEach(key => {
        // ❌ Manual check for each field
        if (!allowedSortFields.includes(key)) {
          throw new Error(`Sort field '${key}' not allowed. Allowed: ${allowedSortFields.join(', ')}`)
        }
        
        // ❌ Manual mapping logic
        let dbField = key
        if (key === 'name') dbField = 'full_name'  // Manual mapping
        if (key === 'email') dbField = 'email_address'  // Manual mapping
        
        sort[dbField] = input.sort[key]
      })
    }
    
    // ❌ Manual default sorting
    if (Object.keys(sort).length === 0) {
      sort['created_at'] = SortEnum.desc
    }
    
    const [docs, total] = await this.repository.findAndCount({
      take: input.limit,
      skip: this.calculateSkip(input),
      order: sort as FindOptionsOrder<UserEntity>,
      where: input.search
    })
    
    return { docs, total, page: input.page, limit: input.limit }
  }
  
  // ❌ Repeat the same validation for every paginate method!
  async findActiveUsers(input: UserListInput): Promise<UserListOutput> {
    // ❌ Copy-paste the same validation logic again...
    const allowedSortFields = ['email', 'name', 'createdAt']
    const sort: { [key: string]: SortEnum } = {}
    // ... repeat 20+ lines of boilerplate
  }
}
```

### 🔥 **Problems with Manual Approach:**

1. **Code Duplication** - Same validation logic repeated everywhere
2. **Type Unsafe** - No compile-time checking of allowed fields
3. **Error Prone** - Easy to forget validation or mapping
4. **Maintenance Hell** - Change entity? Update validation in 10+ places
5. **Inconsistent** - Different error messages across repositories
6. **Verbose** - 20+ lines of boilerplate for simple validation

## ✅ **The Elegant Solution: ValidateDatabaseSortAllowed**

```typescript
import { ValidateDatabaseSortAllowed } from '@/utils/decorators/database'

export class UserRepository {
  
  // ✅ BEAUTIFUL: Single decorator with type safety!
  @ValidateDatabaseSortAllowed<UserEntity>(
    { name: 'email' },                    // Simple field mapping
    { name: 'name' },                     // Direct mapping  
    { name: 'createdAt' }                 // Auto-mapped field
  )
  async paginate(input: UserListInput): Promise<UserListOutput> {
    // ✅ Sort object automatically validated and created!
    // input.sort is now guaranteed to be valid and mapped
    
    const skip = PaginationUtils.calculateSkip(input)
    
    const [docs, total] = await this.repository.findAndCount({
      take: input.limit,
      skip,
      order: input.sort as FindOptionsOrder<IEntity>,  // ✅ Ready to use!
      where: input.search as FindOptionsWhere<IEntity>
    })

    return { 
      docs: docs.map(doc => new UserEntity(doc).toObject()), 
      total, 
      page: input.page, 
      limit: input.limit 
    }
  }
  
  // ✅ Same validation automatically applied to all methods!
  @ValidateDatabaseSortAllowed<UserEntity>(
    { name: 'email' },
    { name: 'name' },
    { name: 'status' },
    { name: 'lastLoginAt', map: 'last_login_date' }  // ✅ Custom mapping
  )
  async findActiveUsers(input: UserListInput): Promise<UserListOutput> {
    // ✅ Zero boilerplate - just business logic!
    return this.repository.findAndCount({
      take: input.limit,
      skip: PaginationUtils.calculateSkip(input),
      order: input.sort as FindOptionsOrder<UserEntity>,
      where: { ...input.search, isActive: true }
    })
  }
}
```

## Advanced Features & Field Mapping

### **🔄 Custom Field Mapping**

```typescript
export class ProductRepository {
  
  @ValidateDatabaseSortAllowed<ProductEntity>(
    { name: 'name' },                           // Direct: name → name
    { name: 'price' },                          // Direct: price → price  
    { name: 'category', map: 'category_name' }, // Mapped: category → category_name
    { name: 'rating', map: 'avg_rating' },      // Mapped: rating → avg_rating
    { name: 'createdAt', map: 'created_date' }  // Mapped: createdAt → created_date
  )
  async paginate(input: ProductListInput): Promise<ProductListOutput> {
    // ✅ Automatic transformation:
    // Input:  { sort: { category: 'asc', rating: 'desc' } }
    // Output: { sort: { category_name: 'asc', avg_rating: 'desc' } }
    
    return this.repository.findAndCount({
      order: input.sort,  // ✅ Ready for database!
      // ... rest of query
    })
  }
}
```

### **🛡️ Type-Safe Validation**

```typescript
// ✅ COMPILE-TIME SAFETY: Only ProductEntity properties allowed
@ValidateDatabaseSortAllowed<ProductEntity>(
  { name: 'name' },        // ✅ Valid: ProductEntity has 'name'
  { name: 'price' },       // ✅ Valid: ProductEntity has 'price'
  { name: 'invalidField' } // ❌ COMPILE ERROR: Property 'invalidField' doesn't exist on ProductEntity
)

// ✅ RUNTIME SAFETY: Automatic validation
// Request: GET /products?sort=name:asc,price:desc,hacker:asc
// Response: 400 Bad Request - "sort hacker not allowed, allowed list: name, price"
```

## Real-World Repository Examples

### **👤 User Repository with Complex Mapping**

```typescript
export class UserRepository {
  
  @ConvertTypeOrmFilter<UserEntity>([
    { name: 'email', type: SearchTypeEnum.equal },
    { name: 'name', type: SearchTypeEnum.like },
    { name: 'status', type: SearchTypeEnum.equal }
  ])
  @ValidateDatabaseSortAllowed<UserEntity>(
    { name: 'email' },
    { name: 'name' },
    { name: 'createdAt' },
    { name: 'lastLogin', map: 'last_login_at' },
    { name: 'profileScore', map: 'profile_completion_score' }
  )
  async paginate(input: UserListInput): Promise<UserListOutput> {
    const skip = PaginationUtils.calculateSkip(input)

    const [docs, total] = await this.repository.findAndCount({
      take: input.limit,
      skip,
      order: input.sort as FindOptionsOrder<IEntity>,    // ✅ Validated & mapped
      where: input.search as FindOptionsWhere<IEntity>   // ✅ From ConvertTypeOrmFilter
    })

    return { 
      docs: docs.map(doc => new UserEntity(doc).toObject()), 
      total, 
      page: input.page, 
      limit: input.limit 
    }
  }
}
```

### **🐱 Cat Repository (MongoDB)**

```typescript
export class CatRepository {
  
  @ConvertMongooseFilter<CatEntity>([
    { name: 'breed', type: SearchTypeEnum.equal },
    { name: 'name', type: SearchTypeEnum.like },
    { name: 'age', type: SearchTypeEnum.between }
  ])
  @ValidateDatabaseSortAllowed<CatEntity>(
    { name: 'createdAt' },
    { name: 'breed' },
    { name: 'age' },
    { name: 'name' }
  )
  async paginate(input: CatListInput): Promise<CatListOutput> {
    const skip = PaginationUtils.calculateSkip(input)

    const [docs, total] = await Promise.all([
      this.repository.find(input.search)
        .sort(input.sort)     // ✅ MongoDB-ready sort object
        .skip(skip)
        .limit(input.limit),
      this.repository.countDocuments(input.search)
    ])

    return { 
      docs: docs.map(doc => new CatEntity(doc).toObject()), 
      total, 
      page: input.page, 
      limit: input.limit 
    }
  }
}
```

### **🔐 Permission Repository with Role Hierarchy**

```typescript
export class PermissionRepository {
  
  @ConvertTypeOrmFilter<PermissionEntity>([
    { name: 'name', type: SearchTypeEnum.like },
    { name: 'resource', type: SearchTypeEnum.equal },
    { name: 'action', type: SearchTypeEnum.equal }
  ])
  @ValidateDatabaseSortAllowed<PermissionEntity>(
    { name: 'name' },
    { name: 'createdAt' },
    { name: 'resource' },
    { name: 'action' },
    { name: 'priority', map: 'execution_priority' }
  )
  async paginate(input: PermissionListInput): Promise<PermissionListOutput> {
    const skip = PaginationUtils.calculateSkip(input)

    const [docs, total] = await this.repository.findAndCount({
      take: input.limit,
      skip,
      order: input.sort as FindOptionsOrder<IEntity>,
      where: input.search as FindOptionsWhere<IEntity>,
      relations: ['roles']  // Include role relationships
    })

    return { 
      docs: docs.map(doc => new PermissionEntity(doc).toObject()), 
      total, 
      page: input.page, 
      limit: input.limit 
    }
  }
}
```

## Request/Response Examples

### **📨 API Request Examples**

```bash
# ✅ Valid sorting requests
GET /users?sort=name:asc,createdAt:desc
GET /products?sort=price:desc  
GET /cats?sort=breed:asc,age:desc

# ❌ Invalid sorting - automatic rejection
GET /users?sort=password:asc,name:desc
# Response: 400 Bad Request
# {
#   "error": "sort password not allowed, allowed list: email, name, createdAt"
# }

GET /products?sort=secretData:asc
# Response: 400 Bad Request  
# {
#   "error": "sort secretData not allowed, allowed list: name, price, category, rating, createdAt"
# }
```

### **🔄 Sort Transformation Examples**

```typescript
// Input from API request
const input = {
  sort: {
    name: SortEnum.asc,        // 1
    rating: SortEnum.desc,     // -1  
    category: SortEnum.asc     // 1
  }
}

// After ValidateDatabaseSortAllowed transformation
const transformedInput = {
  sort: {
    name: SortEnum.asc,           // Direct mapping: name → name
    avg_rating: SortEnum.desc,    // Mapped: rating → avg_rating
    category_name: SortEnum.asc   // Mapped: category → category_name  
  }
}

// Ready for database query!
```

## Integration with Pagination System

### **📊 Complete Pagination Flow**

```typescript
// 1. API Request
GET /api/users?page=2&limit=10&sort=name:asc,createdAt:desc&search=john

// 2. Controller receives typed input
async getUsers(@Query() query: UserListHttpInput): Promise<UserListOutput> {
  return this.userService.paginate(query)
}

// 3. Service delegates to repository  
async paginate(input: UserListInput): Promise<UserListOutput> {
  return this.userRepository.paginate(input)
}

// 4. Repository with decorated method
@ValidateDatabaseSortAllowed<UserEntity>(
  { name: 'name' },
  { name: 'createdAt' },
  { name: 'email' }
)
async paginate(input: UserListInput): Promise<UserListOutput> {
  // ✅ input.sort is validated and ready!
  
  const skip = PaginationUtils.calculateSkip(input)
  
  return this.repository.findAndCount({
    take: input.limit,
    skip,
    order: input.sort,    // ✅ Type-safe and validated
    where: input.search
  })
}

// 5. Database query executes safely
// SQL: SELECT * FROM users WHERE name LIKE '%john%' ORDER BY name ASC, created_at DESC LIMIT 10 OFFSET 10
```

## Why This Decorator is Essential

### **🎯 Problem Prevention**

```typescript
// ❌ Without decorator - SECURITY RISK!
// GET /users?sort=password:asc  
// → Exposes that password field exists
// → Potential data leakage

// ❌ Without decorator - PERFORMANCE KILLER!  
// GET /products?sort=description:asc
// → Sorts by TEXT field without index
// → Query timeout on large tables

// ❌ Without decorator - APPLICATION CRASH!
// GET /orders?sort=customer.creditCard:asc
// → Joins unnecessary tables
// → Memory exhaustion

// ✅ With decorator - ALL PREVENTED!
// → Only whitelisted fields allowed
// → Proper database field mapping
// → Type-safe compile-time checking
```

### **🚀 Performance Benefits**

- **Index-Friendly Sorting** - Only indexed fields allowed
- **Optimized Queries** - No unnecessary joins or fields  
- **Type Safety** - Compile-time validation prevents runtime errors
- **Auto-Mapping** - Frontend fields → Database fields seamlessly

### **🛡️ Security Benefits**

- **Field Whitelisting** - Prevents exposure of sensitive fields
- **SQL Injection Prevention** - Only predefined fields accepted
- **Data Structure Protection** - Prevents internal field discovery
- **Consistent Error Handling** - Standardized rejection messages

### **🔧 Developer Experience**

- **Zero Boilerplate** - Single decorator replaces 20+ lines
- **Type Safety** - Full TypeScript intellisense and validation
- **Consistent API** - Same pattern across all repositories
- **Easy Maintenance** - Change entity, decorator auto-validates

**ValidateDatabaseSortAllowed transforms manual, error-prone sorting validation into elegant, type-safe, automatic sort object generation that's secure, performant, and maintainable!** 🚀