# Tracing

Distributed tracing system that automatically instruments your application and sends telemetry data to Zipkin, providing complete visibility into request flows and performance bottlenecks.

## What It Does

The tracing system automatically captures and sends detailed information about:
- **HTTP requests/responses** - Both incoming and outgoing
- **Database operations** - MongoDB, PostgreSQL queries
- **Cache operations** - Redis commands  
- **Custom business events** - Manual events you add in use cases

All data is exported to **Zipkin** via OTLP (OpenTelemetry Protocol) for visualization and analysis.

## Automatic Instrumentation

The system automatically instruments these components without any code changes:

### HTTP Requests
```typescript
// Automatically traces all HTTP calls
app.get('/users', handler)    // ✅ Traced
app.post('/products', handler) // ✅ Traced
```

### Database Operations
```typescript
// MongoDB operations automatically traced
await User.findOne({ email })     // ✅ Traced as "mongodb => operation-{id}"

// PostgreSQL queries automatically traced  
await db.query('SELECT * FROM users') // ✅ Traced as "postgres => query-{id}"

// Redis operations automatically traced
await redis.get('user:123')      // ✅ Traced as "redis => command-{id}"
```

### Ignored Endpoints
Some endpoints are automatically excluded from tracing:
- `/health` - Health checks
- `/favicon.ico` - Browser favicon requests
- `/api-docs` - API documentation

## Manual Tracing in Use Cases

Every use case receives a `tracing` object that you can use to add custom events and attributes:

### Available Methods

```typescript
export type TracingType = {
  // Log custom events with optional context
  logEvent: (name: string, attributesOrStartTime?: AttributeValue | TimeInput) => void
  
  // Add custom attributes to the current span
  addAttribute: (key: string, value: AttributeValue) => void
  
  // Set span status (success/error)
  setStatus: (status: SpanStatus) => void
  
  // Create child spans
  createSpan: (name: string, parent?: Context) => Span
  
  // Additional utilities
  span: Span
  tracer: Tracer 
  tracerId: string
  finish: () => void
}
```

### Real Usage Examples

Here's how the system is currently used in your use cases:

```typescript
// Cat operations
export class CatCreateUsecase implements IUsecase {
  async execute(input: CatCreateInput, { tracing, user }: ApiTrancingInput): Promise<CatCreateOutput> {
    const entity = new CatEntity({ id: IDGeneratorUtils.uuid(), ...input })
    const created = await this.catRepository.create(entity.toObject())

    // Log business event with context
    tracing.logEvent('cat-created', `cat created by: ${user.email}`)
    
    return created
  }
}
```

### Manual Span Creation

For complex operations that need detailed tracing, you can create **child spans** to track specific sub-operations:

```typescript
export class OrderProcessUsecase implements IUsecase {
  async execute(input: OrderInput, { tracing }: ApiTrancingInput): Promise<OrderOutput> {
    // Main operation continues with the default span
    tracing.logEvent('order-processing-started')
    
    // Create child span for payment processing
    const paymentSpan = tracing.createSpan('payment-processing')
    try {
      const payment = await this.processPayment(input.payment)
      paymentSpan.setAttribute('payment.amount', input.totalAmount)
      paymentSpan.setAttribute('payment.method', input.payment.method)
      paymentSpan.addEvent('payment-completed')
    } finally {
      paymentSpan.end() // Always end child spans
    }
    
    // Create child span for inventory management
    const inventorySpan = tracing.createSpan('inventory-reservation')
    try {
      await this.reserveInventory(input.items)
      inventorySpan.addEvent('inventory-reserved', { items: input.items.length })
    } finally {
      inventorySpan.end()
    }
    
    tracing.logEvent('order-completed')
    return { orderId: newOrder.id }
  }
}
```

**When to Use Child Spans:**
- **Complex operations** with multiple distinct phases
- **External API calls** that need separate timing
- **Heavy computations** that might become bottlenecks
- **Parallel operations** where you want individual metrics

### How to Add Custom Tracing

For most use cases, `logEvent()` is sufficient for tracking business events:

```typescript
export class UserRegistrationUsecase implements IUsecase {
  async execute(input: UserInput, { tracing, user }: ApiTrancingInput): Promise<UserOutput> {
    // Simple event logging - covers 90% of use cases
    tracing.logEvent('user-registration-started')
    
    const newUser = await this.userRepository.create(userData)
    
    tracing.logEvent('user-created', `user: ${newUser.email}`)
    
    return newUser
  }
}
```

## Configuration and Setup

### Automatic Initialization
The tracing system starts automatically when your application boots:
- Connects to OTLP endpoint for Zipkin export
- Configures metric and trace exporters
- Sets up automatic instrumentation

### Environment Considerations
```typescript
// Spans are named differently based on environment
// Development: "API => http://localhost:8080/v1/users"  
// Production: "API => https://api.company.com/v1/users"
```

### Graceful Shutdown
The system automatically handles shutdown signals:
```bash
# SIGTERM or SIGINT triggers graceful tracing shutdown
# Ensures all spans are properly exported before exit
```

## Benefits for Developers

### Request Flow Visibility
- See the complete journey of each request across services
- Identify slow database queries or external API calls
- Understand dependencies between different components

### Performance Monitoring
- Automatic timing for all operations
- Database query performance tracking
- Redis cache hit/miss patterns

### Business Event Tracking
- Custom events for important business actions
- User activity tracking across different operations
- Audit trails for critical operations

### Debugging Support
- Correlate errors with specific request traces
- See exact sequence of operations leading to issues
- Track down performance bottlenecks quickly

## Best Practices

### Event Naming
```typescript
// ✅ Good - Clear, descriptive event names
tracing.logEvent('user-password-changed', `user: ${user.email}`)
tracing.logEvent('order-payment-failed', `amount: ${amount}`)

// ❌ Avoid - Generic or unclear names  
tracing.logEvent('event', 'something happened')
tracing.logEvent('debug', user.toString())
```

### Useful Attributes
```typescript
// Add context that helps with filtering and analysis
tracing.addAttribute('user.role', user.role)
tracing.addAttribute('operation.batch_size', items.length)
tracing.addAttribute('payment.method', paymentMethod)
```

### Error Handling
```typescript
try {
  await riskyOperation()
  tracing.logEvent('operation-succeeded')
} catch (error) {
  tracing.logEvent('operation-failed', error.message)
  tracing.setStatus({ code: SpanStatusCode.ERROR })
  throw error
}
```