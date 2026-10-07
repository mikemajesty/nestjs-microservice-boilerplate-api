# TransformTypeOrmSearch Decorator (Repository Layer)

Transforms **manual, complex TypeORM WHERE clause construction** into elegant, type-safe, automatic filter object generation for **Repository layer** with built-in type conversion, PostgreSQL optimizations, and security validations.

## Shared filter conversion

Numeric equality inputs, including `0`, are converted just like numeric strings.
Equality arrays match any listed value; an empty array matches no rows.
Empty `like` arrays retain their existing behavior of adding no condition.

Both `TransformTypeOrmSearch` and `TransformMongooseSearch` use `convertFilterValue`.
`Number` accepts finite numbers and nonblank numeric strings; invalid values
produce HTTP 400. `Date` returns a JavaScript `Date`, while `DateIso` returns a
complete UTC ISO timestamp, preserving time and milliseconds independently of
`DATE_FORMAT`. This replaces the previous configured date-only formatting for
`DateIso`. Invalid or blank date values produce HTTP 400 rather than an internal
server error. `Boolean` accepts the strings `'true'` and `'false'`; `ObjectId`
validates the value before constructing a MongoDB ObjectId.

`like` parameter names are generated per configured field and array position,
independently of search text, to avoid collisions between conditions.

## The Problem: Manual TypeORM Filter Hell

### ❌ **Without TransformTypeOrmSearch - Manual Nightmare**

```typescript
// UGLY: Manual TypeORM WHERE clause construction
import { FindOperator, In, Raw, Like } from 'typeorm'

export class UserRepository {
  async paginate(input: UserListInput): Promise<UserListOutput> {
    // ❌ Manual validation - error prone!
    const allowedFilterFields = ['email', 'name', 'status', 'createdAt']
    const where: any = {}
    
    if (input.search) {
      Object.keys(input.search).forEach(key => {
        // ❌ Manual check for each field
        if (!allowedFilterFields.includes(key)) {
          throw new Error(`Filter field '${key}' not allowed`)
        }
      })
      
      // ❌ Manual type conversion hell
      if (input.search.email) {
        if (Array.isArray(input.search.email)) {
          // Multiple email search
          where.email = In(input.search.email)
        } else {
          // Single email search
          where.email = input.search.email
        }
      }
      
      // ❌ Manual LIKE construction
      if (input.search.name) {
        if (Array.isArray(input.search.name)) {
          // Multiple name search with PostgreSQL unaccent
          const valueFilter: { [key: string]: unknown } = {}
          input.search.name.forEach((name, index) => {
            valueFilter[`name${index}`] = `%${name}%`
          })
          
          where.name = Raw((alias: string) => {
            return input.search.name
              .map((_, index) => `unaccent(${alias}) ilike unaccent(:name${index})`)
              .join(' OR ')
          }, valueFilter)
        } else {
          // Single name search
          where.name = Raw(
            (alias: string) => `unaccent(${alias}) ilike unaccent(:value)`,
            { value: `%${input.search.name}%` }
          )
        }
      }
      
      // ❌ Manual type conversion for each field type
      if (input.search.status) {
        // Convert string to enum
        where.status = UserStatus[input.search.status as keyof typeof UserStatus]
      }
      
      if (input.search.createdAt) {
        // Convert string to date
        if (Array.isArray(input.search.createdAt)) {
          where.createdAt = In(input.search.createdAt.map(date => new Date(date)))
        } else {
          where.createdAt = new Date(input.search.createdAt)
        }
      }
      
      if (input.search.isActive) {
        // Convert string to boolean
        where.isActive = input.search.isActive === 'true'
      }
      
      if (input.search.age) {
        // Convert string to number with validation
        const age = Number(input.search.age)
        if (isNaN(age)) {
          throw new Error('Invalid age format')
        }
        where.age = age
      }
    }
    
    // ❌ Finally use the manually constructed where clause
    const [docs, total] = await this.repository.findAndCount({
      take: input.limit,
      skip: this.calculateSkip(input),
      where,
      order: input.sort
    })
    
    return { docs, total, page: input.page, limit: input.limit }
  }
  
  // ❌ Repeat the same logic for EVERY method that needs filtering!
  async findActiveUsers(input: UserListInput): Promise<UserListOutput> {
    // ❌ Copy-paste the same 50+ lines of validation and conversion...
  }
}
```

### 🔥 **Problems with Manual Approach:**

1. **Code Duplication** - Same filter logic repeated in every method
2. **Type Conversion Hell** - Manual string → number, string → date, string → boolean
3. **PostgreSQL Specific Logic** - Manual `unaccent()` for accent-insensitive search
4. **Array vs Single Handling** - Manual logic for `In()` vs direct assignment
5. **SQL Injection Risk** - No field whitelisting
6. **Error Prone** - Easy to forget validation or type conversion
7. **Performance Issues** - Inefficient LIKE queries without proper escaping
8. **Maintenance Nightmare** - Change entity? Update filters in 10+ places

## ✅ **The Elegant Solution: TransformTypeOrmSearch**

```typescript
import { TransformTypeOrmSearch, SearchTypeEnum } from '@/utils/decorators/database'

export class UserRepository {
  
  // ✅ BEAUTIFUL: Single decorator with complete automation!
  @TransformTypeOrmSearch<UserEntity>([
    { name: 'email', type: SearchTypeEnum.equal },                    // Auto: In() or exact match
    { name: 'name', type: SearchTypeEnum.like },                      // Auto: Raw() with unaccent
    { name: 'status', type: SearchTypeEnum.equal, format: 'String' }, // Auto: type conversion
    { name: 'createdAt', type: SearchTypeEnum.equal, format: 'Date' }, // Auto: string → Date
    { name: 'isActive', type: SearchTypeEnum.equal, format: 'Boolean' }, // Auto: string → boolean
    { name: 'age', type: SearchTypeEnum.equal, format: 'Number' }     // Auto: string → number
  ])
  async paginate(input: UserListInput): Promise<UserListOutput> {
    // ✅ WHERE clause automatically validated, converted, and ready!
    const skip = PaginationUtils.calculateSkip(input)
    
    const [docs, total] = await this.repository.findAndCount({
      take: input.limit,
      skip,
      where: input.search as FindOptionsWhere<UserEntity>, // ✅ Ready to use!
      order: input.sort as FindOptionsOrder<UserEntity>
    })

    return { 
      docs: docs.map(doc => new UserEntity(doc).toData()), 
      total, 
      page: input.page, 
      limit: input.limit 
    }
  }
  
  // ✅ Same validation automatically applied to all methods!
  @TransformTypeOrmSearch<UserEntity>([
    { name: 'email', type: SearchTypeEnum.equal },
    { name: 'name', type: SearchTypeEnum.like },
    { name: 'department', type: SearchTypeEnum.equal, map: 'department_name' } // ✅ Custom mapping
  ])
  async findActiveUsers(input: UserListInput): Promise<UserListOutput> {
    // ✅ Zero boilerplate - just business logic!
    return this.repository.findAndCount({
      take: input.limit,
      skip: PaginationUtils.calculateSkip(input),
      where: { ...input.search, isActive: true }, // ✅ Filters ready + additional condition
      order: input.sort
    })
  }
}
```

## Advanced Features & Type Conversions

### **🔄 Automatic Type Conversion**

```typescript
export class ProductRepository {
  
  @TransformTypeOrmSearch<ProductEntity>([
    { name: 'name', type: SearchTypeEnum.like },                          // String (no conversion)
    { name: 'price', type: SearchTypeEnum.equal, format: 'Number' },      // String → Number
    { name: 'inStock', type: SearchTypeEnum.equal, format: 'Boolean' },   // String → Boolean  
    { name: 'createdAt', type: SearchTypeEnum.equal, format: 'Date' },    // String → Date
    { name: 'categoryId', type: SearchTypeEnum.equal, format: 'ObjectId' }, // String → ObjectId
    { name: 'sku', type: SearchTypeEnum.equal, format: 'String' }         // Force string
  ])
  async search(input: ProductSearchInput): Promise<ProductSearchOutput> {
    // ✅ Automatic conversions:
    // Input:  { search: { price: '29.99', inStock: 'true', createdAt: '2023-12-01' } }
    // Output: { search: { price: 29.99, inStock: true, createdAt: Date('2023-12-01') } }
    
    return this.repository.findAndCount({
      where: input.search, // ✅ TypeORM-ready with proper types!
      order: input.sort
    })
  }
}
```

### **🔍 LIKE vs EQUAL Search Types**

```typescript
export class BlogRepository {
  
  @TransformTypeOrmSearch<BlogPostEntity>([
    // EQUAL: Exact match or IN() for arrays
    { name: 'status', type: SearchTypeEnum.equal },
    { name: 'authorId', type: SearchTypeEnum.equal },
    { name: 'categoryId', type: SearchTypeEnum.equal },
    
    // LIKE: Fuzzy search with PostgreSQL unaccent  
    { name: 'title', type: SearchTypeEnum.like },
    { name: 'content', type: SearchTypeEnum.like },
    { name: 'tags', type: SearchTypeEnum.like }
  ])
  async search(input: BlogSearchInput): Promise<BlogSearchOutput> {
    // ✅ Generated TypeORM queries:
    
    // EQUAL examples:
    // status: 'published' → WHERE status = 'published'
    // status: ['published', 'draft'] → WHERE status IN ('published', 'draft')
    
    // LIKE examples:  
    // title: 'nodejs' → WHERE unaccent(title) ILIKE unaccent('%nodejs%')
    // title: ['nodejs', 'typescript'] → WHERE unaccent(title) ILIKE unaccent('%nodejs%') OR unaccent(title) ILIKE unaccent('%typescript%')
    
    return this.repository.findAndCount({
      where: input.search,
      order: input.sort
    })
  }
}
```

### **🗺️ Field Mapping & Custom Database Fields**

```typescript
export class OrderRepository {
  
  @TransformTypeOrmSearch<OrderEntity>([
    { name: 'customerEmail', type: SearchTypeEnum.equal, map: 'customer_email' },    // Frontend → DB mapping
    { name: 'status', type: SearchTypeEnum.equal },                                  // Direct mapping
    { name: 'totalAmount', type: SearchTypeEnum.equal, map: 'total_price', format: 'Number' }, // Map + convert
    { name: 'orderDate', type: SearchTypeEnum.equal, map: 'created_at', format: 'Date' },      // Map + convert
    { name: 'customerName', type: SearchTypeEnum.like, map: 'customer_full_name' }   // Map + LIKE search
  ])
  async search(input: OrderSearchInput): Promise<OrderSearchOutput> {
    // ✅ Automatic field mapping:
    // Input:  { customerEmail: 'john@', totalAmount: '99.50', customerName: 'John' }
    // Output: { customer_email: 'john@', total_price: 99.50, customer_full_name: Raw(...) }
    
    return this.repository.findAndCount({
      where: input.search,
      relations: ['customer', 'items']
    })
  }
}
```

## Real-World Repository Examples

### **👤 User Repository with Complex Filtering**

```typescript
export class UserRepository {
  
  @TransformTypeOrmSearch<UserEntity>([
    { name: 'email', type: SearchTypeEnum.equal },
    { name: 'name', type: SearchTypeEnum.like },
    { name: 'status', type: SearchTypeEnum.equal, format: 'String' },
    { name: 'isActive', type: SearchTypeEnum.equal, format: 'Boolean' },
    { name: 'age', type: SearchTypeEnum.equal, format: 'Number' },
    { name: 'department', type: SearchTypeEnum.equal, map: 'department_id', format: 'Number' },
    { name: 'joinDate', type: SearchTypeEnum.equal, format: 'Date' },
    { name: 'salary', type: SearchTypeEnum.equal, format: 'Number' }
  ])
  @TransformSort<UserEntity>(
    { name: 'email' }, { name: 'name' }, { name: 'createdAt' }
  )
  async paginate(input: UserListInput): Promise<UserListOutput> {
    const skip = PaginationUtils.calculateSkip(input)

    const [docs, total] = await this.repository.findAndCount({
      take: input.limit,
      skip,
      order: input.sort as FindOptionsOrder<IEntity>,
      where: input.search as FindOptionsWhere<IEntity>, // ✅ Fully processed filters
      relations: ['roles', 'department']
    })

    return { 
      docs: docs.map(doc => new UserEntity(doc).toData()), 
      total, 
      page: input.page, 
      limit: input.limit 
    }
  }
}
```

### **🛍️ E-commerce Product Repository**

```typescript
export class ProductRepository {
  
  @TransformTypeOrmSearch<ProductEntity>([
    { name: 'name', type: SearchTypeEnum.like },
    { name: 'description', type: SearchTypeEnum.like },
    { name: 'category', type: SearchTypeEnum.equal },
    { name: 'brand', type: SearchTypeEnum.equal },
    { name: 'price', type: SearchTypeEnum.equal, format: 'Number' },
    { name: 'inStock', type: SearchTypeEnum.equal, format: 'Boolean' },
    { name: 'rating', type: SearchTypeEnum.equal, format: 'Number' },
    { name: 'tags', type: SearchTypeEnum.like },
    { name: 'sku', type: SearchTypeEnum.equal, format: 'String' },
    { name: 'weight', type: SearchTypeEnum.equal, format: 'Number' },
    { name: 'isActive', type: SearchTypeEnum.equal, format: 'Boolean' }
  ])
  @TransformSort<ProductEntity>(
    { name: 'price' }, { name: 'rating' }, { name: 'createdAt' }, { name: 'name' }
  )
  async search(input: ProductSearchInput): Promise<ProductSearchOutput> {
    const skip = PaginationUtils.calculateSkip(input)

    const [docs, total] = await this.repository.findAndCount({
      take: input.limit,
      skip,
      where: input.search as FindOptionsWhere<ProductEntity>,
      order: input.sort as FindOptionsOrder<ProductEntity>,
      relations: ['category', 'reviews', 'images']
    })

    return { 
      docs: docs.map(doc => new ProductEntity(doc).toData()), 
      total, 
      page: input.page, 
      limit: input.limit 
    }
  }
}
```

### **📊 Analytics Repository with Date Ranges**

```typescript
export class AnalyticsRepository {
  
  @TransformTypeOrmSearch<AnalyticsEntity>([
    { name: 'userId', type: SearchTypeEnum.equal, format: 'Number' },
    { name: 'eventType', type: SearchTypeEnum.equal },
    { name: 'platform', type: SearchTypeEnum.equal },
    { name: 'country', type: SearchTypeEnum.equal },
    { name: 'city', type: SearchTypeEnum.like },
    { name: 'startDate', type: SearchTypeEnum.equal, map: 'created_at', format: 'Date' },
    { name: 'endDate', type: SearchTypeEnum.equal, map: 'created_at', format: 'Date' },
    { name: 'sessionDuration', type: SearchTypeEnum.equal, format: 'Number' },
    { name: 'isConversion', type: SearchTypeEnum.equal, format: 'Boolean' }
  ])
  async getAnalytics(input: AnalyticsSearchInput): Promise<AnalyticsSearchOutput> {
    // ✅ Complex date and number filtering made simple
    return this.repository.findAndCount({
      where: input.search,
      order: input.sort || { createdAt: 'DESC' },
      relations: ['user', 'session']
    })
  }
}
```

## Request/Response Examples

### **📨 API Request Examples**

```bash
# ✅ Valid filtering requests - automatic type conversion
GET /users?search=name:john,email:john@example.com,isActive:true,age:25
GET /products?search=name:laptop,price:999.99,inStock:true,category:electronics  
GET /orders?search=status:completed,totalAmount:50.00,customerName:john

# ❌ Invalid filtering - automatic rejection
GET /users?search=password:123456,name:john
# Response: 400 Bad Request
# {
#   "error": "filter password not allowed, allowed list: email, name, status, isActive, age"
# }

GET /products?search=secretData:value
# Response: 400 Bad Request  
# {
#   "error": "filter secretData not allowed, allowed list: name, price, category, brand, inStock"
# }

# ❌ Invalid type conversion - automatic validation
GET /products?search=price:not-a-number
# Response: 400 Bad Request
# {
#   "error": "invalid number filter"
# }

GET /users?search=isActive:maybe
# Response: 400 Bad Request
# {
#   "error": "invalid boolean filter"
# }
```

### **🔄 Filter Transformation Examples**

```typescript
// Input from API request  
const input = {
  search: {
    name: 'john',              // LIKE search
    email: 'john@example.com', // EQUAL search
    age: '25',                 // String → Number
    isActive: 'true',          // String → Boolean
    joinDate: '2023-01-15'     // String → Date
  }
}

// After TransformTypeOrmSearch transformation
const transformedInput = {
  search: {
    name: Raw((alias) => `unaccent(${alias}) ilike unaccent(:value)`, { value: '%john%' }),
    email: 'john@example.com',
    age: 25,
    isActive: true, 
    joinDate: new Date('2023-01-15')
  }
}

// Ready for TypeORM findAndCount!
```

### **📊 Array Filtering Examples**

```typescript
// Multiple values automatic handling
const input = {
  search: {
    status: ['active', 'pending', 'completed'],  // Array → In()
    category: ['electronics', 'books'],          // Array → In()
    tags: ['nodejs', 'typescript']               // Array → Multiple LIKE with OR
  }
}

// Transformed to TypeORM operators
const transformed = {
  search: {
    status: In(['active', 'pending', 'completed']),
    category: In(['electronics', 'books']),
    tags: Raw((alias) => 
      `unaccent(${alias}) ilike unaccent(:tag0) OR unaccent(${alias}) ilike unaccent(:tag1)`,
      { tag0: '%nodejs%', tag1: '%typescript%' }
    )
  }
}
```

## PostgreSQL Optimizations

### **🇧🇷 Accent-Insensitive Search**

```sql
-- ✅ Automatic PostgreSQL unaccent() for LIKE searches
-- Input: search=name:josé
-- Generated SQL:
SELECT * FROM users 
WHERE unaccent(name) ILIKE unaccent('%josé%')

-- Matches: José, jose, JOSE, José María, etc.
```

### **📈 Performance Benefits**

```sql
-- ✅ Efficient IN() queries for arrays
-- Input: search=status:active,pending,completed
-- Generated SQL:
SELECT * FROM orders 
WHERE status IN ('active', 'pending', 'completed')

-- ✅ Index-friendly equality searches
-- Input: search=email:john@example.com
-- Generated SQL:
SELECT * FROM users 
WHERE email = 'john@example.com'  -- Uses email index

-- ✅ Properly escaped LIKE searches
-- Input: search=name:john's
-- Generated SQL:  
SELECT * FROM users 
WHERE unaccent(name) ILIKE unaccent('%john''s%')  -- SQL injection safe
```

## Why TransformTypeOrmSearch is Revolutionary

### **🎯 Zero Boilerplate**
- **Single decorator** replaces 50+ lines of manual filter construction
- **Automatic type conversion** for all common types
- **Built-in PostgreSQL optimizations**
- **Array vs single value handling**

### **🛡️ Security & Safety**
- **Field whitelisting** prevents unauthorized filtering
- **SQL injection prevention** through proper escaping
- **Type validation** with automatic error messages
- **Runtime safety** with comprehensive error handling

### **⚡ Performance**
- **Index-friendly queries** with proper operator selection
- **PostgreSQL-optimized** LIKE searches with unaccent
- **Efficient array filtering** with IN() operators
- **Reduced query complexity** through smart operator choice

### **🔧 Developer Experience**
- **Type-safe** with full TypeScript support
- **Consistent API** across all repositories
- **Auto-complete** for allowed filter fields
- **Easy maintenance** - change entity, decorator validates automatically

**TransformTypeOrmSearch transforms complex, error-prone TypeORM WHERE clause construction into elegant, type-safe, automatic filter generation that's secure, performant, and PostgreSQL-optimized!** 🚀