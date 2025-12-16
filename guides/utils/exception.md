# Exception

Centralized error handling system that provides a consistent base for all application errors, ensuring uniform error structure, tracing, and response formatting across the entire project.

## Purpose

This utility serves as the **central hub for all error handling** throughout the application. Instead of using generic exceptions or inconsistent error formats, all errors extend from `BaseException`, providing standardized error handling, tracing integration, and consistent API responses.

## BaseException - Foundation for All Errors

The `BaseException` class is the foundation that all application errors inherit from:

```typescript
export class BaseException extends HttpException {
  traceid!: string           // Tracing correlation ID
  readonly context!: string  // Error context information
  readonly statusCode: number // HTTP status code
  readonly code?: string     // Optional error code
  readonly parameters!: ParametersType  // Additional error details

  constructor(message: MessageType, status: HttpStatus, parameters?: ParametersType) {
    // Extends NestJS HttpException with enhanced capabilities
  }
}
```

**Key Features:**
- ✅ **Tracing Integration**: Every error includes tracing correlation
- ✅ **Consistent Structure**: All errors have the same format
- ✅ **Rich Context**: Detailed error information for debugging
- ✅ **Frontend Details**: `details` field shown to users in frontend
- ✅ **Context Tracking**: `context` identifies exactly where errors occurred
- ✅ **Type Safety**: Full TypeScript support with proper types
- ✅ **Stack Traces**: Automatic stack trace capture

## Built-in Exception Types

The system provides pre-defined exceptions for common HTTP scenarios:

```typescript
// Standard HTTP error types available
ApiInternalServerException   // 500 - Server errors
ApiNotFoundException        // 404 - Resource not found  
ApiConflictException        // 409 - Business logic conflicts
ApiUnprocessableEntityException // 422 - Validation errors
ApiUnauthorizedException    // 401 - Authentication required
ApiBadRequestException      // 400 - Invalid request format
ApiForbiddenException       // 403 - Permission denied
ApiTimeoutException         // 408 - Request timeout
```

## Critical Fields for Frontend Integration

### details - User-Visible Error Details

The `details` parameter is **directly shown to users in the frontend**. This field is perfect for validation errors, missing fields, or any user-actionable information.

**Practical Example - Zod Validation Errors:**
```typescript
export class UserCreateUsecase implements IUsecase {
  async execute(input: UserCreateInput): Promise<UserCreateOutput> {
    try {
      // Validate input with Zod
      const validatedInput = userCreateSchema.parse(input)
    } catch (zodError) {
      // Transform Zod errors to user-friendly details
      const validationDetails = zodError.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        value: err.code
      }))
      
      throw new ApiBadRequestException('validationFailed', {
        context: 'UserCreateUsecase.execute',
        details: validationDetails  // ← This shows in frontend!
      })
    }
  }
}
```

**What the Frontend Receives:**
```json
{
  "error": {
    "code": "validationFailed",
    "message": ["Validation failed"],
    "details": [
      {
        "field": "email",
        "message": "Invalid email format",
        "value": "invalid_string"
      },
      {
        "field": "password",
        "message": "Password must be at least 8 characters",
        "value": "too_small"
      },
      {
        "field": "age",
        "message": "Age must be a positive number",
        "value": "invalid_type"
      }
    ]
  }
}
```

**Other Practical Uses for details:**

```typescript
// File upload errors
throw new ApiBadRequestException('fileUploadFailed', {
  context: 'FileUploadService.uploadAvatar',
  details: [
    { issue: 'File too large', maxSize: '5MB', currentSize: '12MB' },
    { issue: 'Invalid format', allowed: ['jpg', 'png'], received: 'gif' }
  ]
})

// Business rule violations
throw new ApiUnprocessableEntityException('businessRuleViolation', {
  context: 'OrderProcessUsecase.validateOrder', 
  details: [
    { rule: 'Minimum order amount', required: '$25.00', current: '$15.50' },
    { rule: 'Product availability', product: 'iPhone 15', stock: 0 }
  ]
})

// Permission details
throw new ApiForbiddenException('insufficientPermissions', {
  context: 'UserDeleteUsecase.execute',
  details: [
    { required: 'admin_users_delete', current: 'user_read' },
    { resource: 'User #1234', action: 'delete' }
  ]
})
```

### context - Error Location Tracking

The `context` field identifies **exactly where in your code** the error occurred. This is crucial for debugging and helps developers quickly locate issues.

**Common Patterns:**
```typescript
// Pattern: ClassName.methodName
throw new ApiNotFoundException('userNotFound', {
  context: 'UserRepository.findByEmail',  // ← Clear location
  details: [{ searchEmail: 'john@example.com' }]
})

// Pattern: ServiceName.operation
throw new ApiTimeoutException('databaseTimeout', {
  context: 'DatabaseService.connectToMongo',
  details: [{ timeout: '30s', database: 'users_db' }]
})

// Pattern: ModuleName.UsecaseName.step
throw new ApiConflictException('duplicateEntity', {
  context: 'User.CreateUsecase.validateUniqueEmail',
  details: [{ conflictingEmail: input.email }]
})

// Pattern: Layer.Component.action
throw new ExternalServiceException('PaymentAPI', 'gatewayUnavailable', {
  context: 'Infra.PaymentService.processCharge',
  details: [{ provider: 'Stripe', endpoint: '/v1/charges' }]
})
```

**Benefits of Good Context:**
- **Fast Debugging**: Developers know exactly where to look
- **Log Filtering**: Easy to filter logs by component or layer
- **Monitoring**: Track error patterns by context
- **Team Communication**: Clear error location in bug reports

## Usage in Business Logic
```typescript
// Use case throwing business logic errors
export class UserCreateUsecase implements IUsecase {
  async execute(input: UserCreateInput): Promise<UserCreateOutput> {
    const existingUser = await this.userRepository.findByEmail(input.email)
    
    if (existingUser) {
      throw new ApiConflictException('userAlreadyExists', {
        context: 'UserCreateUsecase',
        details: { email: input.email }
      })
    }
    
    // Business logic continues...
  }
}

// Repository throwing not found errors
export class UserRepository implements IUserRepository {
  async findById(id: string): Promise<UserEntity> {
    const user = await this.model.findById(id)
    
    if (!user) {
      throw new ApiNotFoundException('userNotFound', {
        context: 'UserRepository.findById',
        details: { userId: id }
      })
    }
    
    return new UserEntity(user)
  }
}
```

## Creating Custom Exceptions

For domain-specific errors, you can easily create custom exceptions:

```typescript
// Custom business domain exception
export class OrderProcessingException extends BaseException {
  static STATUS = HttpStatus.UNPROCESSABLE_ENTITY
  
  constructor(message?: MessageType, parameters?: ParametersType) {
    super(
      message ?? 'orderProcessingFailed', 
      OrderProcessingException.STATUS, 
      parameters
    )
  }
}

// Payment-specific exception
export class PaymentFailedException extends BaseException {
  static STATUS = HttpStatus.PAYMENT_REQUIRED // 402
  
  constructor(message?: MessageType, parameters?: ParametersType) {
    super(
      message ?? 'paymentProcessingFailed',
      PaymentFailedException.STATUS,
      parameters
    )
  }
}

// External service exception  
export class ExternalServiceException extends BaseException {
  static STATUS = HttpStatus.BAD_GATEWAY // 502
  
  constructor(serviceName: string, message?: MessageType, parameters?: ParametersType) {
    super(
      message ?? `${serviceName}ServiceUnavailable`,
      ExternalServiceException.STATUS,
      { ...parameters, service: serviceName }
    )
  }
}
```

### Using Custom Exceptions

```typescript
export class OrderPaymentUsecase implements IUsecase {
  async execute(input: OrderPaymentInput): Promise<OrderPaymentOutput> {
    // Domain-specific error handling
    const order = await this.orderRepository.findById(input.orderId)
    
    if (order.status !== 'pending') {
      throw new OrderProcessingException('orderNotPayable', {
        context: 'OrderPaymentUsecase',
        details: { orderId: order.id, currentStatus: order.status }
      })
    }
    
    try {
      // Process payment with external service
      const payment = await this.paymentService.charge(input.amount)
    } catch (error) {
      // Transform external errors to our format
      throw new PaymentFailedException('creditCardDeclined', {
        context: 'OrderPaymentUsecase',
        details: { 
          orderId: order.id, 
          amount: input.amount,
          originalError: error.message 
        }
      })
    }
  }
}

export class ExternalApiUsecase implements IUsecase {
  async execute(input: ApiInput): Promise<ApiOutput> {
    try {
      const response = await this.httpClient.get('/external-api')
      return response.data
    } catch (error) {
      // Standardize external service errors
      throw new ExternalServiceException('PaymentGateway', 'serviceTimeout', {
        context: 'ExternalApiUsecase',
        details: { endpoint: '/external-api', timeout: '30s' }
      })
    }
  }
}
```

## Error Response Structure

All exceptions follow a consistent API response format:

```typescript
export type ApiErrorType = {
  error: {
    code: string | number      // Error identifier
    traceid: string           // Correlation ID for tracing
    context: string           // Where the error occurred
    message: string[]         // User-friendly message(s)
    details?: unknown[]       // Additional debugging information
    name: string             // Exception class name
    timestamp: string        // When the error occurred
    path: string             // API endpoint where error happened
  }
}
```

### Example Error Response

```json
{
  "error": {
    "code": "userAlreadyExists",
    "traceid": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "context": "UserCreateUsecase",
    "message": ["User with this email already exists"],
    "details": [{ "email": "john@example.com" }],
    "name": "ApiConflictException", 
    "timestamp": "2024-01-15T10:30:00Z",
    "path": "/api/v1/users"
  }
}
```

## Benefits of Centralization

### Consistency
- All errors follow the same structure and format
- Standardized tracing integration across all exceptions
- Uniform API responses for frontend consumption

### Debugging & Monitoring
- Every error includes correlation IDs for distributed tracing
- Rich context information for troubleshooting
- Structured error data for monitoring and alerting

### Type Safety
- Full TypeScript support with proper error types
- Compile-time validation of error parameters
- IDE autocompletion for error details

### Maintainability
- Single place to modify error handling behavior
- Easy to add new custom exceptions following the same pattern
- Consistent error handling across different domains

### Frontend Integration
- Predictable error structure for API consumers
- Standard error codes for specific handling
- Rich error details when needed for user feedback

## Exception Factory - Converting External Errors

For scenarios where you need to **transform external HTTP responses or third-party errors** into your standardized exception format, the `createExceptionFromStatus` factory provides seamless conversion.

### When to Use Exception Factory

**Perfect for these scenarios:**
- 🔗 **External API Integration**: Transform third-party API errors
- 📡 **HTTP Client Responses**: Convert generic HTTP status codes  
- 🔄 **Error Forwarding**: Maintain error context across service boundaries
- 🎯 **Microservice Communication**: Standardize inter-service error handling

### Basic Usage

```typescript
import { createExceptionFromStatus } from '@/utils/exception'

export class PaymentService {
  async processPayment(data: PaymentData): Promise<PaymentResult> {
    try {
      const response = await this.paymentGateway.charge(data)
      return response.data
    } catch (externalError) {
      // Transform external error to our standard format
      throw createExceptionFromStatus({
        status: externalError.status,        // HTTP status from external API
        message: 'paymentProcessingFailed',  // Our standardized message
        parameters: {
          context: 'PaymentService.processPayment',
          details: [{ 
            gateway: 'Stripe',
            transactionId: data.transactionId,
            amount: data.amount 
          }]
        },
        originalStack: externalError.stack   // Preserve original error trace
      })
    }
  }
}
```

### Advanced Examples

**External API Integration:**
```typescript
export class UserSyncService {
  async syncUserFromCRM(userId: string): Promise<UserEntity> {
    const response = await fetch(`${this.crmBaseUrl}/users/${userId}`)
    
    if (!response.ok) {
      // Convert HTTP response to our exception format
      throw createExceptionFromStatus({
        status: response.status,             // 404, 401, 500, etc.
        message: 'externalUserNotFound',
        parameters: {
          context: 'UserSyncService.syncUserFromCRM',
          details: [{ 
            userId, 
            crmEndpoint: `${this.crmBaseUrl}/users/${userId}`,
            responseStatus: response.status,
            responseText: await response.text()
          }]
        }
      })
    }
    
    return new UserEntity(await response.json())
  }
}
```

**Microservice Error Forwarding:**
```typescript
export class OrderService {
  async validateInventory(items: OrderItem[]): Promise<void> {
    try {
      await this.inventoryService.checkAvailability(items)
    } catch (inventoryError) {
      // Forward inventory service error with our context
      throw createExceptionFromStatus({
        status: inventoryError.statusCode,
        message: 'inventoryValidationFailed',
        parameters: {
          context: 'OrderService.validateInventory',
          details: [{ 
            items: items.map(item => ({ sku: item.sku, quantity: item.quantity })),
            inventoryService: 'ProductCatalogMS'
          }]
        },
        originalStack: inventoryError.stack
      })
    }
  }
}
```

**Database Connection Errors:**
```typescript
export class DatabaseHealthService {
  async checkConnection(): Promise<HealthStatus> {
    try {
      await this.connection.ping()
      return { status: 'healthy' }
    } catch (dbError) {
      // Convert database errors to HTTP format
      const httpStatus = this.mapDatabaseErrorToHttp(dbError.code)
      
      throw createExceptionFromStatus({
        status: httpStatus,
        message: 'databaseConnectionFailed',
        parameters: {
          context: 'DatabaseHealthService.checkConnection',
          details: [{ 
            database: 'users_db',
            host: process.env.DB_HOST,
            errorCode: dbError.code,
            timeout: '30s'
          }]
        },
        originalStack: dbError.stack
      })
    }
  }
  
  private mapDatabaseErrorToHttp(errorCode: string): number {
    const errorMap = {
      'ECONNREFUSED': 503,    // Service Unavailable
      'ETIMEDOUT': 408,       // Request Timeout  
      'ENOTFOUND': 502,       // Bad Gateway
      'ECONNRESET': 503,      // Service Unavailable
    }
    return errorMap[errorCode] ?? 500
  }
}
```

### Status Code Mapping

The factory automatically maps HTTP status codes to appropriate exception classes:

```typescript
// Automatic mapping examples:
createExceptionFromStatus({ status: 400 }) // → ApiBadRequestException
createExceptionFromStatus({ status: 401 }) // → ApiUnauthorizedException  
createExceptionFromStatus({ status: 403 }) // → ApiForbiddenException
createExceptionFromStatus({ status: 404 }) // → ApiNotFoundException
createExceptionFromStatus({ status: 408 }) // → ApiTimeoutException
createExceptionFromStatus({ status: 409 }) // → ApiConflictException
createExceptionFromStatus({ status: 422 }) // → ApiUnprocessableEntityException
createExceptionFromStatus({ status: 999 }) // → ApiInternalServerException (fallback)
```

### Original Stack Trace Preservation

When using `originalStack`, the factory preserves both error contexts:

```typescript
const externalError = new Error('Payment gateway timeout')
const ourException = createExceptionFromStatus({
  status: 408,
  message: 'paymentTimeout', 
  originalStack: externalError.stack
})

// Result stack trace contains both:
console.log(ourException.stack)
/*
ApiTimeoutException: paymentTimeout
    at PaymentService.processPayment (/app/services/payment.ts:45:12)
    at OrderController.checkout (/app/controllers/order.ts:23:8)
--- Original Error ---
Error: Payment gateway timeout
    at PaymentGateway.charge (/app/integrations/stripe.ts:12:15)
    at PaymentService.processPayment (/app/services/payment.ts:40:22)
*/
```

### Benefits of Exception Factory

**Consistency Across Integrations:**
- All external errors follow the same format as internal errors
- Unified error handling in controllers and filters
- Standard `details` and `context` fields for all errors

**Debugging & Monitoring:**  
- Preserves original error information for troubleshooting
- Clear separation between our error context and external error source
- Tracing correlation IDs maintained across service boundaries

**Type Safety:**
- Full TypeScript support for external error transformation
- Compile-time validation of status codes and parameters  
- IDE autocompletion for error factory options