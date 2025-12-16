# Mock Schema Generator

Automatic mock generation from Zod schemas that eliminates manual mock maintenance. This utility leverages [zod-mock-schema](https://github.com/mikemajesty/zod-mock-schema) to generate **realistic, type-safe test data** automatically from your validation schemas.

## Why This is a Game Changer

### Manual Mock Maintenance Pain

Without automatic mock generation, developers face constant maintenance overhead:

```typescript
// ❌ MANUAL MOCK: Breaks every time schema changes
const mockUser = {
  id: 'uuid-123',
  name: 'John Doe',
  email: 'john@example.com',
  createdAt: new Date(),
  // Oops! Forgot new 'role' field added to schema
  // Oops! Missing new 'isVerified' field 
  // Tests pass but don't reflect real data structure
}
```

### Automatic Mock Generation Solution

With ZodMockSchema, mocks **automatically evolve** with your schemas:

```typescript
// ✅ AUTOMATIC MOCK: Always stays in sync with schema
const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['user', 'admin']),      // New field? Automatically included!
  isVerified: z.boolean(),              // Another new field? Also included!
  createdAt: z.date(),
  updatedAt: z.date().optional()
})

const mockUser = ZodMockSchema.generate(userSchema)
// Result: Perfect mock with ALL fields, realistic data types
```

## Centralized Import Pattern

**IMPORTANT**: Always import through our centralized export, not directly from the library:

```typescript
// ✅ CORRECT: Use centralized import
import { ZodMockSchema, MockOptions } from '@/utils/test/mock'

// ❌ WRONG: Direct import bypasses centralization
import { ZodMockSchema } from '@mikemajesty/zod-mock-schema'
```

This centralization allows us to:
- **Control the API** across the entire application
- **Add custom configurations** or wrapper functions if needed
- **Update the underlying library** without changing imports everywhere
- **Maintain consistency** in mock generation patterns

## Basic Usage Examples

### Entity Mock Generation

```typescript
import { ZodMockSchema } from '@/utils/test/mock'

const userEntitySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().min(18).max(100),
  role: z.enum(['user', 'admin']),
  isActive: z.boolean(),
  createdAt: z.date()
})

describe('UserService', () => {
  it('should process user data correctly', () => {
    // Generate perfect mock automatically
    const mockUser = ZodMockSchema.generate(userEntitySchema)
    
    const userEntity = new UserEntity(mockUser)
    const result = userService.processUser(userEntity)
    
    expect(result).toBeDefined()
    expect(mockUser.id).toMatch(/^[0-9a-f-]{36}$/) // Valid UUID
    expect(mockUser.email).toContain('@')           // Valid email
    expect(mockUser.age).toBeGreaterThanOrEqual(18) // Respects constraints
  })
})
```

### Custom Mock Options

```typescript
import { ZodMockSchema, MockOptions } from '@/utils/test/mock'

describe('OrderService', () => {
  it('should handle high-value orders', async () => {
    const orderSchema = z.object({
      id: z.string().uuid(),
      customerId: z.string().uuid(),
      amount: z.number().min(0),
      currency: z.string().length(3)
    })

    // Custom options for specific test scenarios
    const mockOrder = ZodMockSchema.generate(orderSchema, {
      amount: 50000,        // Specific high value for this test
      currency: 'USD'       // Specific currency
    } as MockOptions)
    
    const result = await orderService.processHighValueOrder(mockOrder)
    expect(result.requiresApproval).toBe(true)
  })
})
```

## Schema Evolution Benefits

When schemas evolve, mocks automatically stay in sync:

```typescript
// Version 1: Original schema
const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string()
})

// Version 2: Schema evolves (new fields added)
const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.enum(['user', 'admin']),           // NEW FIELD
  permissions: z.array(z.string())           // NEW FIELD
})

// Same test code, but now includes new fields automatically!
const mockUser = ZodMockSchema.generate(userSchema)
// mockUser automatically has role, permissions with realistic data
```

## Integration with TestUtils

```typescript
import { TestUtils } from '@/utils/test/util'
import { ZodMockSchema } from '@/utils/test/mock'

describe('UserRepository', () => {
  it('should save user entity', async () => {
    // Combine automatic mock generation with standardized IDs
    const mockUser = ZodMockSchema.generate(userEntitySchema)
    mockUser.id = TestUtils.getMockUUID()           // Use standard UUID
    mockUser.createdAt = TestUtils.getMockDate()    // Use standard date
    
    const mockSave = TestUtils.mockResolvedValue<void>()
    const repository = new UserRepository({ save: mockSave })
    
    await repository.save(new UserEntity(mockUser))
    
    expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({
      id: TestUtils.getMockUUID(),
      name: expect.any(String),
      email: expect.stringContaining('@')
    }))
  })
})
```

## Advanced Library Features

For more advanced features like custom generators, seed data, and complex transformations, see the complete documentation at:

**📚 [zod-mock-schema Documentation](https://github.com/mikemajesty/zod-mock-schema)**

The library provides extensive customization options including:
- **Custom data generators** for specific field types
- **Seed data** for reproducible tests
- **Transform functions** for post-processing generated data
- **Recursive depth control** for nested structures
- **Custom faker configurations** for localized data

## Benefits Summary

### 🎯 **Zero Mock Maintenance**
- **Automatic evolution** when schemas change
- **Always up-to-date** test data
- **Eliminates manual mock updates**
- **Reduces test maintenance overhead**

### 🔒 **Type Safety & Realism**  
- **Schema-compliant data** always
- **Realistic constraints** respected (min/max, regex patterns)
- **Proper data types** for all fields
- **Validation-ready** mock data

### 🚀 **Developer Productivity**
- **Instant mock generation** for new schemas
- **No boilerplate** mock creation code
- **Focus on test logic** not mock data
- **Consistent test data** across team

### 🔧 **Integration Friendly**
- **Works with existing patterns** (TestUtils, Entity validation)
- **Customizable** for specific test scenarios
- **Centralized import** maintains consistency
- **Library updates** without code changes

ZodMockSchema transforms test data creation from **manual, error-prone maintenance** into **automatic, reliable, and always-current** mock generation.