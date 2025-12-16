# Test Utils

Essential testing utilities that provide **type-safe mocking**, **standardized validation testing**, and **centralized common mocks**. This is the foundation of all testing in the application - every test should use TestUtils for consistency and compile-time safety.

## Why TestUtils is Essential for Every Test

### Type Safety in Tests

TestUtils provides **compile-time type checking** for all mock operations, preventing runtime errors and ensuring your tests remain valid when code changes:

```typescript
// ❌ WRONG: No type safety, breaks silently when UserEntity changes
const mockUser = {
  id: '123',
  name: 'John',
  emial: 'john@example.com' // Typo not caught!
}

// ✅ CORRECT: Type-safe, catches errors at compile time
const mockUser = TestUtils.mockReturnValue<UserEntity>({
  id: '123',
  name: 'John',
  email: 'john@example.com' // TypeScript catches typos
})
```

### Centralized Mock Standards

All commonly used mocks are centralized here, ensuring **consistency across all tests** and reducing boilerplate:

```typescript
// Instead of recreating these in every test file
const mockDate = TestUtils.getMockDate()        // Always: Sat Feb 10 2024 14:00:35
const mockUUID = TestUtils.getMockUUID()        // Always: 9269248e-54cc-46f9-80c0-7029c989c0e3
const mockObjectId = TestUtils.getMockObjectId() // Always: 671d15ddd0bcb68467b767d0
const mockUser = TestUtils.getMockUser()        // Consistent user structure
const mockTracing = TestUtils.getMockTracing()  // Complete tracing setup
```

## Type-Safe Mock Methods

### Promise-Based Operations

```typescript
describe('UserService', () => {
  it('should create user successfully', async () => {
    // Type-safe repository mock with expected return type
    const mockSave = TestUtils.mockResolvedValue<void>()
    const mockFindByEmail = TestUtils.mockResolvedValue<UserEntity | null>(null)

    const userRepositoryMock = {
      save: mockSave,
      findByEmail: mockFindByEmail
    }

    const userService = new UserService(userRepositoryMock)
    
    await userService.createUser({
      name: 'John Doe',
      email: 'john@example.com'
    })

    // Type-safe assertions
    expect(mockSave).toHaveBeenCalledTimes(1)
    expect(mockFindByEmail).toHaveBeenCalledWith('john@example.com')
  })

  it('should handle duplicate email error', async () => {
    // Mock existing user found
    const existingUser = TestUtils.mockReturnValue<UserEntity>({
      id: TestUtils.getMockUUID(),
      email: 'john@example.com',
      name: 'Existing User'
    })

    const mockFindByEmail = TestUtils.mockResolvedValue(existingUser)
    
    const userRepositoryMock = {
      findByEmail: mockFindByEmail
    }

    const userService = new UserService(userRepositoryMock)

    await expect(userService.createUser({
      name: 'John Doe',
      email: 'john@example.com'
    })).rejects.toThrow(ApiConflictException)
  })
})
```

### Exception Handling

```typescript
describe('ExternalAPIService', () => {
  it('should handle external service failures', async () => {
    // Type-safe exception mocking
    const networkError = new ApiTimeoutException('serviceUnavailable', {
      context: 'ExternalAPIService.fetchData',
      details: [{ service: 'PaymentGateway', timeout: '30s' }]
    })

    const mockFetch = TestUtils.mockRejectedValue(networkError)
    
    const externalService = new ExternalAPIService({ fetch: mockFetch })

    await expect(externalService.processPayment(paymentData))
      .rejects.toThrow(ApiTimeoutException)

    expect(mockFetch).toHaveBeenCalledWith('/api/payment', expect.any(Object))
  })
})
```

## nameOf - Type-Safe Property Access

The `nameOf` utility prevents **string-based property references** that break silently when code changes:

### Validation Testing (Primary Use Case)

```typescript
describe('UserCreateUsecase Validation', () => {
  const usecase = new UserCreateUsecase(mockDependencies)

  it('should validate email format', async () => {
    const invalidInput = {
      name: 'John Doe',
      email: 'invalid-email' // Invalid format
    }

    await TestUtils.expectZodError(
      () => usecase.execute(invalidInput),
      (issues) => {
        // ✅ Type-safe property check - no magic strings!
        expect(issues).toContainEqual({
          path: TestUtils.nameOf<UserCreateInput>('email'), // Compile-time safe
          message: expect.stringContaining('Invalid email')
        })
      }
    )
  })

  it('should validate required fields', async () => {
    const incompleteInput = {
      email: 'john@example.com'
      // Missing name field
    }

    await TestUtils.expectZodError(
      () => usecase.execute(incompleteInput),
      (issues) => {
        expect(issues).toContainEqual({
          path: TestUtils.nameOf<UserCreateInput>('name'), // Type-safe field reference
          message: expect.stringContaining('Required')
        })
      }
    )
  })
})
```

### Property Mapping in Tests

```typescript
describe('Entity Property Mapping', () => {
  it('should map database fields correctly', () => {
    const dbUser = {
      user_id: '123',
      user_name: 'John',
      user_email: 'john@example.com'
    }

    const entity = mapDbUserToEntity(dbUser)

    // Type-safe property assertions
    expect(entity[TestUtils.nameOf<UserEntity>('id')]).toBe('123')
    expect(entity[TestUtils.nameOf<UserEntity>('name')]).toBe('John')
    expect(entity[TestUtils.nameOf<UserEntity>('email')]).toBe('john@example.com')
  })
})
```

### Search and Filter Testing

```typescript
describe('UserSearchService', () => {
  it('should filter users by email domain', async () => {
    const searchCriteria = {
      [TestUtils.nameOf<UserSearchInput>('email')]: '@company.com'
    }

    const results = await userSearchService.search(searchCriteria)

    expect(results.every(user => 
      user[TestUtils.nameOf<UserEntity>('email')].includes('@company.com')
    )).toBe(true)
  })
})
```

## expectZodError - Standardized Validation Testing

For usecases decorated with `@ValidatorSchema`, this utility provides **consistent validation error testing**:

### UseCase Input Validation

```typescript
describe('CreateOrderUsecase', () => {
  const usecase = new CreateOrderUsecase(mockDependencies)

  it('should validate order amount', async () => {
    const invalidOrder = {
      customerId: TestUtils.getMockUUID(),
      items: [],
      amount: -100 // Invalid negative amount
    }

    await TestUtils.expectZodError(
      () => usecase.execute(invalidOrder),
      (issues) => {
        expect(issues).toContainEqual({
          path: TestUtils.nameOf<CreateOrderInput>('amount'),
          message: expect.stringContaining('must be positive')
        })
      }
    )
  })

  it('should validate customer ID format', async () => {
    const invalidOrder = {
      customerId: 'invalid-uuid',
      items: [{
        productId: TestUtils.getMockUUID(),
        quantity: 1,
        price: 99.99
      }],
      amount: 99.99
    }

    await TestUtils.expectZodError(
      () => usecase.execute(invalidOrder),
      (issues) => {
        expect(issues).toContainEqual({
          path: TestUtils.nameOf<CreateOrderInput>('customerId'),
          message: expect.stringContaining('Invalid UUID')
        })
      }
    )
  })

  it('should validate nested item properties', async () => {
    const invalidOrder = {
      customerId: TestUtils.getMockUUID(),
      items: [{
        productId: TestUtils.getMockUUID(),
        quantity: 0, // Invalid quantity
        price: 99.99
      }],
      amount: 99.99
    }

    await TestUtils.expectZodError(
      () => usecase.execute(invalidOrder),
      (issues) => {
        expect(issues).toContainEqual({
          path: TestUtils.nameOf<OrderItem>('quantity'),
          message: expect.stringContaining('must be greater than 0')
        })
      }
    )
  })
})
```

### Complex Validation Scenarios

```typescript
describe('UserProfileUpdateUsecase', () => {
  it('should validate multiple field constraints', async () => {
    const invalidInput = {
      userId: 'invalid-id',
      name: '', // Empty name
      age: 17, // Under minimum age
      email: 'not-an-email' // Invalid format
    }

    await TestUtils.expectZodError(
      () => usecase.execute(invalidInput),
      (issues) => {
        // Multiple validation errors in one test
        expect(issues).toEqual(
          expect.arrayContaining([
            {
              path: TestUtils.nameOf<UserUpdateInput>('userId'),
              message: expect.stringContaining('Invalid UUID')
            },
            {
              path: TestUtils.nameOf<UserUpdateInput>('name'),
              message: expect.stringContaining('cannot be empty')
            },
            {
              path: TestUtils.nameOf<UserUpdateInput>('age'),
              message: expect.stringContaining('must be 18 or older')
            },
            {
              path: TestUtils.nameOf<UserUpdateInput>('email'),
              message: expect.stringContaining('Invalid email')
            }
          ])
        )
      }
    )
  })
})
```

## Centralized Common Mocks

### When to Add Mocks Here vs Entity/UseCase Specific

**✅ ADD to TestUtils:**
- **Frequently used across many tests** (UUIDs, dates, basic user)
- **Infrastructure concerns** (tracing, logging, external IDs)
- **Common data types** that appear in multiple contexts
- **Standardized test data** for consistency

**❌ DON'T add to TestUtils:**
- **Entity-specific complex data** (belongs in entity test files)
- **UseCase-specific scenarios** (belongs in usecase test files)
- **Business logic specific data** (domain-specific)
- **One-off test data** used only in specific tests

### Standard Mock Usage

```typescript
describe('OrderProcessingService', () => {
  it('should process order with consistent test data', () => {
    const order = new OrderEntity({
      id: TestUtils.getMockUUID(), // Consistent across all tests
      customerId: TestUtils.getMockUUID(),
      createdAt: TestUtils.getMockDate(), // Always same date for predictable tests
      items: [
        {
          id: TestUtils.getMockObjectId(), // MongoDB ObjectId when needed
          name: 'Test Product',
          price: 99.99
        }
      ]
    })

    // Test with consistent, predictable data
    expect(order.id).toBe('9269248e-54cc-46f9-80c0-7029c989c0e3')
    expect(order.createdAt).toEqual(new Date('Sat Feb 10 2024 14:00:35'))
  })

  it('should handle tracing context', async () => {
    const mockTracing = TestUtils.getMockTracing()
    
    // Full tracing context for integration tests
    const result = await orderService.processOrder(orderData, mockTracing)
    
    expect(result.tracing.user).toEqual({
      id: TestUtils.getMockUUID(),
      email: 'test',
      name: 'test'
    })
  })
})
```

## Implementation Mocks for Complex Scenarios

```typescript
describe('PaymentProcessingService', () => {
  it('should handle payment gateway responses', async () => {
    // Custom implementation for specific scenario
    const mockPaymentGateway = TestUtils.mockImplementation<PaymentResult>(
      (amount: number, cardToken: string) => {
        if (amount > 10000) {
          throw new PaymentException('amountTooHigh')
        }
        return {
          transactionId: TestUtils.getMockUUID(),
          status: 'approved',
          amount: amount
        }
      }
    )

    const paymentService = new PaymentService(mockPaymentGateway)
    
    // Test successful payment
    const result = await paymentService.processPayment(5000, 'card_token')
    expect(result.status).toBe('approved')
    
    // Test amount validation
    await expect(
      paymentService.processPayment(15000, 'card_token')
    ).rejects.toThrow(PaymentException)
  })
})
```

## Benefits of TestUtils Standardization

### 🎯 **Compile-Time Safety**
- **Type checking** prevents test breakage when code changes
- **Property name validation** eliminates string-based references
- **Mock type safety** ensures test data matches expectations

### 🔄 **Consistency Across Tests**
- **Standardized mock data** makes tests predictable
- **Common patterns** reduce learning curve for developers
- **Uniform validation testing** with expectZodError

### 🛠️ **Maintenance Benefits**
- **Single place** to update common mock data
- **Centralized utilities** reduce test boilerplate
- **Easy refactoring** when interfaces change

### 🚀 **Developer Experience**
- **IntelliSense support** for all mock operations
- **Clear patterns** for new developers to follow
- **Reduced test setup time** with ready-to-use utilities

TestUtils transforms testing from **error-prone manual mocking** into a **type-safe, standardized, and maintainable** testing foundation.