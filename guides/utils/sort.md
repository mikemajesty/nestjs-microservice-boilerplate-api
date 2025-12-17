# Sort

Standardized sorting system that works consistently across all list endpoints, regardless of the database backend (MongoDB or PostgreSQL).

## Purpose

Provides a unified sorting interface for all list operations in the application. While MongoDB and PostgreSQL have different internal sorting mechanisms, this utility ensures all endpoints accept and process sorting parameters in the exact same way.

## Usage in Controllers

Every controller with list endpoints uses the sort standardization:

```typescript
// Example: Cat list endpoint
@Get()
@Permission('cat:list')
async list(@Req() { query }: ApiRequest): Promise<CatListOutput> {
  const input: CatListInput = {
    sort: SortHttpSchema.parse(query.sort),  // ← Standardized parsing
    search: SearchHttpSchema.parse(query.search),
    limit: Number(query.limit),
    page: Number(query.page)
  }
  
  return await this.listUsecase.execute(input)
}
```

## HTTP API Format

### Query Parameter Format

```bash
# Single field
GET /api/v1/users?sort=name:asc
GET /api/v1/products?sort=price:desc

# Multiple fields (priority order)
GET /api/v1/orders?sort=status:asc,createdAt:desc
GET /api/v1/users?sort=role:asc,name:asc

# Default sorting (if not provided)
GET /api/v1/cats  # → Automatically sorted by createdAt:desc
```

### Valid Sort Orders
- `asc` - Ascending order (1, 2, 3... / A, B, C...)
- `desc` - Descending order (3, 2, 1... / Z, Y, X...)

### Validation Rules
- Format must be `field:order` 
- Multiple sorts separated by commas
- Order defaults to `asc` if not specified
- Automatically adds `createdAt:desc` if no sort provided

## Use Case Integration

In use cases, the standardized sort is combined with pagination and search:

```typescript
export enum SortEnum {
  asc = 1,
  desc = -1
}

export type SortInput = { sort: Record<string, SortEnum> }

// Core layer - consistent across all domains
export const UserListSchema = InputValidator.intersection(
  PaginationSchema, 
  SortSchema.and(SearchSchema)
)

// Combined type used in list operations
export type PaginationInput<T> = PaginationSchema & SortInput & SearchInput<Partial<T>>

export class UserListUsecase implements IUsecase {
  async execute(input: UserListInput): Promise<UserListOutput> {
    // input.sort is already standardized object format
    return this.userRepository.paginate(input)
  }
}
```

## Internal Transformation

The system transforms HTTP query strings into standardized objects:

```typescript
// Input: "name:asc,createdAt:desc"
// Output: { name: 1, createdAt: -1 }

// Input: "price:desc"  
// Output: { price: -1, createdAt: -1 }  // Auto-adds createdAt

// Input: undefined
// Output: { createdAt: -1 }  // Default sort
```

## Database Compatibility

### MongoDB
```typescript
// Uses numeric values directly
{ name: 1, createdAt: -1 }  // ✅ Works with MongoDB
```

### PostgreSQL  
```typescript
// Repository adapters convert to SQL
{ name: 1, createdAt: -1 }  → "ORDER BY name ASC, created_at DESC"
```

## Benefits

### Consistent API
All list endpoints accept sorting in the same format:
```bash
GET /api/v1/users?sort=name:asc
GET /api/v1/products?sort=price:desc  
GET /api/v1/orders?sort=status:asc,total:desc
```

### Framework Agnostic
Core business logic receives standardized sort objects, independent of:
- HTTP framework details
- Database-specific syntax
- Query parameter parsing

### Default Behavior
Every list automatically sorts by `createdAt:desc` if no sort is specified, ensuring predictable and chronological results.