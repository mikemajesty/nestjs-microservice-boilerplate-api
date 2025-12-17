# Pagination

Standardized pagination system that works consistently across all list endpoints, providing automatic input validation, limits, and response formatting.

## Purpose

Like search and sort utilities, pagination standardizes input handling across different database backends, ensuring all list endpoints accept pagination parameters in the same format with consistent validation and limits.

## Usage in Controllers

Every controller with list endpoints uses the pagination standardization:

```typescript
@Get()
@Permission('user:list')
async list(@Req() { query }: ApiRequest): Promise<UserListOutput> {
  const input: UserListInput = {
    page: Number(query.page),      // ← Automatic validation and defaults
    limit: Number(query.limit),    // ← Max 100 items per page
    sort: SortHttpSchema.parse(query.sort),
    search: SearchHttpSchema.parse(query.search)
  }
  
  return await this.listUsecase.execute(input)
}
```

## HTTP API Format

### Query Parameters

```bash
# Default pagination (page 1, limit 10)
GET /api/v1/users

# Specific page and limit
GET /api/v1/users?page=2&limit=20

# Maximum allowed limit (100)
GET /api/v1/users?page=1&limit=150  # → Automatically capped at 100

# Invalid values get defaults
GET /api/v1/users?page=abc&limit=-5  # → page=1, limit=10
```

## Automatic Validation and Transformation

### Input Handling
- **page**: Defaults to `1`, must be positive integer
- **limit**: Defaults to `10`, must be positive integer, **maximum 100**
- **Invalid values**: Automatically converted to defaults
- **Type flexibility**: Accepts numbers, strings, or NaN values

### Maximum Limit Protection

The system enforces a **100-item maximum** per page to prevent performance issues:

```typescript
const maxLimit = (limit: number) => (limit > 100 ? 100 : limit)
```

**To increase the limit**: Simply modify the `maxLimit` function if your application needs more than 100 items per page.

## Utility Functions

### PaginationUtils.calculateSkip()

Calculates database skip/offset for query optimization:

```typescript
// For page 3 with limit 20: skip = (3-1) * 20 = 40
const skip = PaginationUtils.calculateSkip({ page: 3, limit: 20 })
```

### PaginationUtils.calculateTotalPages()

Calculates total pages for response metadata:

```typescript
const totalPages = PaginationUtils.calculateTotalPages({ 
  limit: 20, 
  total: 85 
}) // → 5 pages
```

## Integration with Search and Sort

Pagination works seamlessly with filtering and sorting through combined types:

```typescript
// Individual types that combine into complete list functionality
export type SortInput = { sort: Record<string, SortEnum> }
export type SearchInput<T> = { search: T | null }

// Combined input type used in all list operations  
export type PaginationInput<T> = Infer<typeof PaginationSchema> & SortInput & SearchInput<Partial<T>>

// Combined output type for consistent list responses
export type PaginationOutput<T> = Infer<typeof PaginationSchema> & { 
  total: number
  docs: T[]
  totalPages?: number 
}

// Use case receives complete pagination context
export const UserListSchema = InputValidator.intersection(
  PaginationSchema,
  SortSchema.and(SearchSchema)
)
```

## Response Format

All paginated responses follow a consistent structure:

```typescript
export type PaginationOutput<T> = {
  page: number
  limit: number
  total: number        // Total items in database
  totalPages?: number  // Total pages available
  docs: T[]           // Actual data items
}
```

### API Response Example

```json
{
  "page": 2,
  "limit": 20,
  "total": 85,
  "totalPages": 5,
  "docs": [
    { "id": "21", "name": "User 21" },
    { "id": "22", "name": "User 22" }
  ]
}
```

## Database Compatibility

### MongoDB
```typescript
// Uses skip and limit directly
collection.find().skip(40).limit(20)
```

### PostgreSQL
```typescript
// Repository adapters convert to SQL
"LIMIT 20 OFFSET 40"
```

## Benefits

### Performance Protection
- **100-item limit** prevents expensive queries
- **Skip calculation** optimizes database queries
- **Integer validation** ensures safe database operations

### Consistent API
All list endpoints accept pagination in the same format:
```bash
GET /api/v1/users?page=2&limit=20
GET /api/v1/products?page=3&limit=50
GET /api/v1/orders?page=1&limit=100
```

### Automatic Defaults
Invalid or missing pagination parameters don't break the API - they fall back to sensible defaults (page=1, limit=10).