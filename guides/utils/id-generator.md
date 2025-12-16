# ID Generator

Centralized ID generation system for the entire project, providing multiple ID formats optimized for different use cases while maintaining consistency and type safety across all entities.

## Overview

This utility serves as the **focal point for ID creation** throughout the project. Instead of generating IDs manually or using multiple different libraries, all entities use `IDGeneratorUtils` for consistent, secure, and appropriate ID generation.

## Default Standard: UUID v4

The project uses **UUID v4** as the default standard for most entities:

```typescript
// Standard entity creation pattern
const entity = new CatEntity({ 
  id: IDGeneratorUtils.uuid(),  // ← Default UUID v4
  name: 'Fluffy' 
})

const user = new UserEntity({ 
  id: IDGeneratorUtils.uuid(),  // ← UUID v4 for users
  name: 'John Doe',
  email: 'john@example.com' 
})

const permission = new PermissionEntity({ 
  id: IDGeneratorUtils.uuid(),  // ← UUID v4 for permissions
  name: 'user:read' 
})
```

**Why UUID v4 as Default:**
- ✅ Globally unique across distributed systems
- ✅ Cryptographically secure random generation
- ✅ No coordination needed between servers
- ✅ Works perfectly with both MongoDB and PostgreSQL
- ✅ Industry standard (RFC 4122)

## Available ID Types

### 1. UUID (Default)
```typescript
// Basic UUID v4 (most common)
const id = IDGeneratorUtils.uuid()
// → "f47ac10b-58cc-4372-a567-0e02b2c3d479"

// UUID with prefix for better identification
const userId = IDGeneratorUtils.uuid({ prefix: 'user_' })
// → "user_f47ac10b-58cc-4372-a567-0e02b2c3d479"

// Different UUID versions
const timestampId = IDGeneratorUtils.uuid({ version: 1 })  // UUID v1 (timestamp-based)
const hashedId = IDGeneratorUtils.uuid({ version: 3, namespace: '...' })  // UUID v3 (MD5 hash)
const sha1Id = IDGeneratorUtils.uuid({ version: 5, namespace: '...' })    // UUID v5 (SHA-1 hash)
```

### 2. ULID (Sortable by Time)
```typescript
// Time-sortable ID - great for logs and events
const logId = IDGeneratorUtils.ulid()
// → "01F8Z6K4V3HJ7WQ5RXT9M2G1NY"

// ULID with prefix for better categorization
const eventId = IDGeneratorUtils.ulid({ prefix: 'evt_' })
// → "evt_01F8Z6K4V3HJ7WQ5RXT9M2G1NY"

// Lowercase ULID for URL friendliness
const shortUrl = IDGeneratorUtils.ulid({ lowercase: true })
// → "01f8z6k4v3hj7wq5rxt9m2g1ny"
```

### 3. NanoID (Compact & URL-Safe)
```typescript
// Compact ID for URLs and short references
const shortId = IDGeneratorUtils.nanoid()
// → "V1StGXR8_Z5jdHi6B-myT"

// Custom length for different use cases
const referenceCode = IDGeneratorUtils.nanoid({ length: 8 })
// → "V1StGXR8"

// Custom alphabet for specific requirements
const numericId = IDGeneratorUtils.nanoid({ 
  alphabet: '0123456789',
  length: 12 
})
// → "581947362859"
```

### 4. ObjectID (MongoDB Compatible)
```typescript
// MongoDB-style ObjectID
const mongoId = IDGeneratorUtils.objectid()
// → "507f1f77bcf86cd799439011"

// ObjectID with prefix for external systems
const documentId = IDGeneratorUtils.objectid({ prefix: 'doc_' })
// → "doc_507f1f77bcf86cd799439011"

// ObjectID with specific timestamp (useful for testing)
const historicalId = IDGeneratorUtils.objectid({ 
  timestamp: 1672531200  // 2023-01-01
})
// → "63b3c8000000000000000000"
```

## Usage in Entities

### Simple Entity Examples

```typescript
// Cat entity - basic entity structure
const cat = new CatEntity({ 
  id: IDGeneratorUtils.uuid(),
  name: 'Whiskers' 
})

// Product entity - e-commerce example
const product = new ProductEntity({ 
  id: IDGeneratorUtils.uuid(),
  name: 'Laptop' 
})

// Order entity - using ULID for time-based sorting
const order = new OrderEntity({ 
  id: IDGeneratorUtils.ulid(),  // Sortable by creation time
  total: 299.99 
})

// Session entity - using NanoID for compact URLs
const session = new SessionEntity({ 
  id: IDGeneratorUtils.nanoid({ length: 16 }),  // Compact for URLs
  userId: 'user_12345' 
})

// Legacy system integration - using ObjectID
const migrationRecord = new MigrationRecordEntity({ 
  id: IDGeneratorUtils.objectid(),  // MongoDB compatibility
  status: 'pending' 
})
```

### Advanced Entity Usage with Prefixes

```typescript
// Using prefixes for better identification and debugging
const user = new UserEntity({ 
  id: IDGeneratorUtils.uuid({ prefix: 'usr_' }),
  name: 'John Doe' 
})
// → usr_f47ac10b-58cc-4372-a567-0e02b2c3d479

const apiKey = new ApiKeyEntity({ 
  id: IDGeneratorUtils.nanoid({ prefix: 'ak_', length: 32 }),
  name: 'Production Key' 
})
// → ak_V1StGXR8_Z5jdHi6B-myTabc123def

const logEntry = new LogEntryEntity({ 
  id: IDGeneratorUtils.ulid({ prefix: 'log_' }),
  message: 'User logged in' 
})
// → log_01F8Z6K4V3HJ7WQ5RXT9M2G1NY
```

## Dynamic ID Generation

For flexible ID generation based on configuration:

```typescript
// Type-safe dynamic generation
const id = IDGeneratorUtils.generate('ulid', { prefix: 'evt_' })
const shortId = IDGeneratorUtils.generate('nanoid', { length: 8 })
const mongoId = IDGeneratorUtils.generate('objectid')

// Using the generators map for runtime selection
const idType: IDGeneratorType = 'uuid'  // Could come from config
const dynamicId = IDGeneratorUtils.generators[idType]({ prefix: 'dyn_' })
```

## Best Practices

### When to Use Each Type

- **UUID v4** (Default): Most entities, distributed systems, primary keys
- **ULID**: Time-series data, logs, events, when chronological order matters
- **NanoID**: URLs, short references, frontend IDs, session tokens
- **ObjectID**: MongoDB compatibility, legacy system integration

### Entity Creation Pattern

```typescript
// Standard pattern used throughout the project
export class ExampleCreateUsecase implements IUsecase {
  async execute(input: ExampleCreateInput): Promise<ExampleCreateOutput> {
    const entity = new ExampleEntity({ 
      id: IDGeneratorUtils.uuid(),  // Always generate ID in use case
      ...input 
    })
    
    return await this.repository.create(entity.toObject())
  }
}
```

### Benefits of Centralization

- ✅ **Consistency**: All IDs follow the same generation patterns
- ✅ **Type Safety**: Full TypeScript support with proper options
- ✅ **Flexibility**: Easy to change ID strategy project-wide
- ✅ **Performance**: Cryptographically secure, optimized generation
- ✅ **Debugging**: Prefixes make logs and debugging much easier
- ✅ **Standards**: Follows industry best practices (RFC 4122, ULID spec, etc.)