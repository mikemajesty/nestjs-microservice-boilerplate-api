# Search

Standardized search system that works consistently across all list endpoints, allowing multiple field filters with flexible value matching regardless of database backend.

## Purpose

Provides a unified search interface for filtering data across all domains. Like the sort utility, this ensures MongoDB and PostgreSQL endpoints accept and process search parameters in the exact same format.

## Usage in Controllers

Every controller with list endpoints uses the search standardization:

```typescript
// Example: User list endpoint
@Get()
@Permission('user:list')
async list(@Req() { query }: ApiRequest): Promise<UserListOutput> {
  const input: UserListInput = {
    search: SearchHttpSchema.parse(query.search),  // ← Standardized parsing
    sort: SortHttpSchema.parse(query.sort),
    limit: Number(query.limit),
    page: Number(query.page)
  }
  
  return await this.listUsecase.execute(input)
}
```

## HTTP API Format

### Single Field Search

```bash
# Search by name
GET /api/v1/users?search=name:john

# Search by email
GET /api/v1/users?search=email:john@example.com

# Search by status
GET /api/v1/orders?search=status:pending
```

### Multiple Field Search

```bash
# Search by name AND role
GET /api/v1/users?search=name:john,role:admin

# Search by status AND date range
GET /api/v1/orders?search=status:completed,createdAt:2024-01-01

# Search by multiple criteria
GET /api/v1/products?search=category:electronics,brand:apple,price:1000
```

### Multiple Values for Same Field (OR Logic)

```bash
# Search users with role admin OR manager
GET /api/v1/users?search=role:admin|manager

# Search orders with status pending OR processing
GET /api/v1/orders?search=status:pending|processing

# Search products in multiple categories  
GET /api/v1/products?search=category:electronics|clothing|books

# Combine multiple fields with multiple values
GET /api/v1/products?search=category:electronics|clothing,brand:apple|samsung
```

## Advanced Examples

### E-commerce Product Search
```bash
# Products in electronics OR clothing categories, from apple OR samsung
GET /api/v1/products?search=category:electronics|clothing,brand:apple|samsung

# Products with specific price range and multiple brands
GET /api/v1/products?search=price:100,brand:apple|google|microsoft
```

### User Management Search
```bash
# Users with admin OR manager role, active status
GET /api/v1/users?search=role:admin|manager,status:active

# Users created in January OR February, from specific departments
GET /api/v1/users?search=month:january|february,department:engineering|marketing
```

### Order Filtering
```bash
# Orders that are pending OR processing, from multiple customers
GET /api/v1/orders?search=status:pending|processing,customerId:123|456|789

# Orders with high OR urgent priority, from last month
GET /api/v1/orders?search=priority:high|urgent,period:last_month
```

## Internal Transformation

The system transforms HTTP query strings into standardized objects:

```typescript
// Single values
"name:john" → { name: "john" }

// Multiple fields  
"name:john,role:admin" → { name: "john", role: "admin" }

// Multiple values (OR logic)
"role:admin|manager" → { role: ["admin", "manager"] }

// Complex combination
"role:admin|manager,status:active,department:tech|sales" 
→ { 
  role: ["admin", "manager"], 
  status: "active", 
  department: ["tech", "sales"] 
}
```

## Database Compatibility

### MongoDB
```typescript
// Direct object matching
{ role: ["admin", "manager"] }  // Uses $in operator
{ status: "active" }           // Direct match
```

### PostgreSQL
```typescript
// Repository adapters convert to SQL
{ role: ["admin", "manager"] }  → "WHERE role IN ('admin', 'manager')"
{ status: "active" }           → "WHERE status = 'active'"
```

## Use Case Integration

Search works seamlessly with pagination and sorting:

```typescript
export type SearchInput<T> = { search: T | null }

// Combined with pagination and sort for complete list functionality
export type PaginationInput<T> = PaginationSchema & SortInput & SearchInput<Partial<T>>

export const UserListSchema = InputValidator.intersection(
  PaginationSchema, 
  SortSchema.and(SearchSchema)
)

export class UserListUsecase implements IUsecase {
  async execute(input: UserListInput): Promise<UserListOutput> {
    // input.search contains standardized filter object
    return this.userRepository.paginate(input)
  }
}
```

## Validation Rules

- Format: `field:value` for single values
- Multiple fields: separated by commas `field1:value1,field2:value2`
- Multiple values: separated by pipes `field:value1|value2|value3`
- Cannot start with colon `:value` (invalid)
- Must contain at least one colon `field:value`

## Benefits

### Flexible Filtering
- **Single field, single value**: `status:active`
- **Single field, multiple values**: `role:admin|manager`  
- **Multiple fields**: `name:john,role:admin`
- **Complex combinations**: `role:admin|manager,status:active|pending`

### Database Agnostic
Core business logic receives standardized search objects, independent of database-specific query syntax.

### Consistent API
All list endpoints accept search filters in the same format, making the API predictable and easy to use.