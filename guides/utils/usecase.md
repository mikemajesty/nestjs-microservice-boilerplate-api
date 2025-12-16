# Use Case Interface

Simple contract that ensures consistency across all business logic operations throughout the application, maintaining clean separation between core domain logic and application layers.

## Purpose

The `IUsecase` interface serves as the foundation for all business operations in the application, enforcing a consistent pattern for executing domain logic while maintaining architectural boundaries.

## Clean Architecture Compliance

### Core Layer Usage

All use cases in the **core layer** implement `IUsecase` directly:

```typescript
// src/core/user/use-cases/user-create.ts
export class UserCreateUsecase implements IUsecase {
  @ValidateSchema(UserCreateSchema)
  async execute(input: UserCreateInput, tracing: ApiTrancingInput): Promise<UserCreateOutput> {
    // Pure business logic - no external dependencies
    // Only uses repository interfaces, not implementations
  }
}
```

### Application Layer Separation

The **application layer** (modules) cannot access core use cases directly. Instead, it uses adapter interfaces that also implement `IUsecase`:

```typescript
// src/modules/user/adapter.ts - Adapter also implements IUsecase
export abstract class IUserCreateAdapter implements IUsecase {
  abstract execute(input: UserCreateInput, trace: ApiTrancingInput): Promise<UserCreateOutput>
}
```

### Connecting Adapters to Use Cases

The connection between adapters and actual use cases happens in the module's `module.ts` file:

```typescript
// src/modules/user/module.ts
@Module({
  providers: [
    // Bind adapter interface to actual core use case
    { provide: IUserCreateAdapter, useClass: UserCreateUsecase },
    { provide: IUserUpdateAdapter, useClass: UserUpdateUsecase },
    { provide: IUserDeleteAdapter, useClass: UserDeleteUsecase }
  ]
})
export class UserModule {}
```

**Key Point**: Both the adapter (interface) and the use case (implementation) implement `IUsecase`, ensuring:
- **Consistent contract**: Same interface for both abstraction and implementation
- **Type safety**: TypeScript ensures matching signatures
- **Clean injection**: NestJS can seamlessly bind abstract to concrete classes

This separation ensures:
- **Core remains pure**: Business logic has no knowledge of infrastructure
- **Dependency inversion**: Application depends on abstractions, not concrete implementations  
- **Testability**: Core logic can be tested independently
- **Maintainability**: Changes in one layer don't affect others

## How to Use

### Creating a New Use Case

1. **Define in Core Layer**:
```typescript
export class ProductCreateUsecase implements IUsecase {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly loggerService: ILoggerAdapter
  ) {}

  @ValidateSchema(ProductCreateSchema)
  async execute(input: ProductCreateInput, { tracing }: ApiTrancingInput): Promise<ProductCreateOutput> {
    // 1. Validate business rules
    // 2. Create domain entities
    // 3. Persist through repository interface
    // 4. Log events
    // 5. Return result
  }
}
```

2. **Create Adapter in Module Layer**:
```typescript
export abstract class IProductCreateAdapter implements IUsecase {
  abstract execute(input: ProductCreateInput, trace: ApiTrancingInput): Promise<ProductCreateOutput>
}
```

3. **Wire in Module and Controller**:
```typescript
// src/modules/product/module.ts - Connect adapter to use case
@Module({
  providers: [
    { provide: IProductCreateAdapter, useClass: ProductCreateUsecase }
  ]
})
export class ProductModule {}

// src/modules/product/controller.ts - Use adapter in controller
@Controller('products')
export class ProductController {
  constructor(
    private readonly productCreateAdapter: IProductCreateAdapter
  ) {}

  @Post()
  async create(@Body() body: ProductCreateInput) {
    return this.productCreateAdapter.execute(body)
  }
}
```

## Benefits for Developers

### Consistency
Every business operation follows the same pattern:
- Single `execute` method
- Typed inputs and outputs
- Standardized error handling
- Uniform tracing integration

### Type Safety
```typescript
export type ProductCreateInput = Infer<typeof ProductCreateSchema>
export type ProductCreateOutput = CreatedModel

// TypeScript ensures correct usage throughout the application
```

### Testing Simplification
```typescript
// Mock any use case easily
const mockUseCase: IUsecase = {
  execute: jest.fn().mockResolvedValue(expectedResult)
}
```

### Dependency Injection
The interface makes it easy to swap implementations:
```typescript
// Development
providers: [{ provide: IUserCreateAdapter, useClass: UserCreateUsecase }]

// Testing
providers: [{ provide: IUserCreateAdapter, useClass: MockUserCreateUsecase }]
```

## Architectural Benefits

### Clean Boundaries
- **Core**: Contains business logic, implements `IUsecase` directly
- **Application**: Uses adapters that implement `IUsecase` for contracts
- **Infrastructure**: Provides implementations for core interfaces

### Framework Independence
Since core use cases only depend on the simple `IUsecase` interface, they remain framework-agnostic and can be easily ported or tested outside the NestJS context.

### Scalability
Adding new business operations is straightforward - just implement `IUsecase` and follow the established patterns for validation, logging, and error handling.