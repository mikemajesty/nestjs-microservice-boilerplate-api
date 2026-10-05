# Search

Standardized HTTP search syntax for list endpoints. The parser returns a
database-agnostic object; repository decorators validate allowed fields and
translate that object into MongoDB or PostgreSQL queries.

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

# Search a numeric field
GET /api/v1/cats?search=age:2
```

### Multiple Field Search

```bash
# Search by name AND email
GET /api/v1/users?search=name:john,email:john@example.com

# Search cats by name, breed, and age
GET /api/v1/cats?search=name:luna,breed:siamese,age:2
```

### Multiple Values for Same Field (OR Logic)

```bash
# Search cats with either breed
GET /api/v1/cats?search=breed:siamese|persian

# Combine a list and a single field
GET /api/v1/cats?search=breed:siamese|persian,age:2
```

## Internal Transformation

The system transforms HTTP query strings into standardized objects:

```typescript
// Single values
"name:john" → { name: "john" }

// Multiple fields
"name:john,email:john@example.com" → { name: "john", email: "john@example.com" }

// Multiple values (OR logic)
"breed:siamese|persian" → { breed: ["siamese", "persian"] }

// Complex combination
"breed:siamese|persian,age:2"
→ {
  breed: ["siamese", "persian"],
  age: "2"
}
```

## Filter Behavior

`SearchHttpSchema` only parses the HTTP value. The repository's
`@ConvertTypeOrmFilter()` or `@ConvertMongooseFilter()` decorator defines:

- which fields are accepted;
- the comparison type (`equal` or `like`);
- optional value conversion, such as `Number`.

For example, the Cats repository permits `name` and `breed` as `like`, and
`age` as an equality filter converted to a number. Sending a field that is not
explicitly allowed results in a `400 Bad Request`.

`|` produces an array. `equal` converts that array to an `IN` query in
PostgreSQL; `like` generates one partial-match condition per value. Consult
the relevant repository decorator when adding a new filter.

## Database Translation

### MongoDB
```typescript
// Decorators build MongoDB equality or case-insensitive regex conditions.
{ status: "active" }
{ name: { $regex: "john", $options: "i" } }
```

### PostgreSQL
```typescript
// Repository decorators convert parsed filters to TypeORM operators.
{ status: ["active", "pending"] } → "WHERE status IN ('active', 'pending')"
{ name: "john" }                 → "WHERE unaccent(name) ILIKE unaccent('john')"
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

- One filter uses `field:value`.
- Multiple filters are separated by commas:
  `field1:value1,field2:value2`.
- Multiple values for one field are separated by pipes:
  `field:value1|value2|value3`.
- A filter cannot start with `:` and every filter must have a value.
- Whitespace around values is trimmed.
- Field names and values cannot safely contain `,`, `|`, or `:` because they
  are syntax separators. Use a different filter or extend the parser before
  accepting values that require those characters.
- Repeating the same field in the query keeps the last value:
  `search=name:first,name:last` becomes `{ name: 'last' }`.

## Benefits

### Flexible Filtering
- **Single field, single value**: `name:john`
- **Single field, multiple values**: `breed:siamese|persian`
- **Multiple fields**: `name:john,email:john@example.com`
- **Complex combinations**: `breed:siamese|persian,age:2`

### Database Agnostic
Core business logic receives standardized search objects, while each repository
applies the database-specific query syntax and its allowed field list.

### Consistent API
All list endpoints accept search filters in the same format, making the API predictable and easy to use.
