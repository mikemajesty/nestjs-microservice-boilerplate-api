# Request

Type definitions and utilities for standardizing request handling across the application, providing consistent access to user context, tracing, and request data.

## Core Types

### ApiRequest

Default interface used by all controller methods throughout the application.

```typescript
export interface ApiRequest {
  readonly body: any
  readonly tracing: TracingType
  readonly user: UserRequest  
  readonly params: { [key: string]: string | number }
  readonly query: { [key: string]: string | number }
  readonly headers: Headers & { authorization: string }
  readonly url: string
  readonly files: FileUpload[]
}
```

**Where Used**: Standard pattern for all controller methods via `@Req()` decorator destructuring.

**Purpose**: Every controller method receives `ApiRequest` as the default request type, allowing consistent access to `body`, `params`, `query`, `user`, and `tracing` across all endpoints without framework-specific dependencies.

**Example Usage**:
```typescript
@Controller('cats')
export class CatController {
  @Post()
  @Permission('cat:create')
  async create(@Req() { body, user, tracing }: ApiRequest): Promise<CatCreateOutput> {
    // body: request payload
    // user: authenticated user info (id, email, name)
    // tracing: for logging events and monitoring
    return await this.createUsecase.execute(body, { user, tracing })
  }

  @Get(':id')
  @Permission('cat:getbyid')  
  async getById(@Req() { params }: ApiRequest): Promise<CatGetByIdOutput> {
    // params: URL parameters like { id: "123" }
    return await this.getByIdUsecase.execute(params)
  }

  @Get()
  @Permission('cat:list')
  async list(@Req() { query }: ApiRequest): Promise<CatListOutput> {
    // query: query string parameters for filtering/sorting
    return await this.listUsecase.execute(query)
  }
}
```

The `user` property contains the **authenticated user information** (extracted from JWT token), and `tracing` provides **monitoring capabilities** for logging business events and performance tracking.

### TracingType

Defines the complete tracing interface available in every request context.

```typescript
export type TracingType = {
  span: Span
  tracer: Tracer
  tracerId: string
  axios: (config?: AxiosRequestConfig) => AxiosInstance
  setStatus: (status: SpanStatus) => void
  logEvent: (name: string, attributesOrStartTime?: AttributeValue | TimeInput) => void
  addAttribute: (key: string, value: AttributeValue) => void
  createSpan: (name: string, parent?: Context) => Span
  finish: () => void
}
```

**Where Used**: Passed to use cases through `ApiTrancingInput` for distributed tracing and monitoring.

**Purpose**: Provides complete tracing capabilities while abstracting OpenTelemetry implementation details from business logic.

### UserRequest

Simplified user representation extracted from the authenticated user context.

```typescript
export type UserRequest = Pick<UserEntity, 'email' | 'name' | 'id'>
```

**Where Used**: Controllers and use cases that need user context for business operations and audit trails.

**Purpose**: Provides essential user information without exposing the complete user entity, maintaining security and performance.

### ApiTrancingInput

Specialized type that extracts only tracing and user context from requests.

```typescript
export type ApiTrancingInput = Pick<ApiRequest, 'user' | 'tracing'>
```

**Where Used**: Use case `execute()` methods as the second parameter for operations that need user context and tracing.

**Purpose**: Provides a clean interface for passing observability and user context to business logic without coupling to HTTP concerns.

## Usage Context

### Controller Layer
Controllers receive `ApiRequest` through the `@Req()` decorator, providing access to all request data, user authentication, and tracing capabilities.

### Use Case Layer  
Use cases receive `ApiTrancingInput` to access user context for business rules and tracing for observability, without being coupled to HTTP request details.

### File Upload Support
The `files` property supports file upload scenarios with complete file metadata including buffer, encoding, mimetype, and size information.

### Framework Independence
These types abstract away NestJS/Express request objects, making the core business logic framework-agnostic while providing all necessary request context.