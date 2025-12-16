# CircuitBreaker Decorator

Elegant **resilience decorator** that transforms the complex Opossum circuit breaker library into a simple, declarative pattern. This decorator provides **automatic failure protection** for critical methods with sophisticated state management and monitoring capabilities.

## The Native Library Problem

Without the decorator, using Opossum circuit breaker is verbose and error-prone:

```typescript
// ❌ UGLY: Native Opossum implementation
import CircuitBreaker from 'opossum'

export class PaymentService {
  private circuitBreaker: CircuitBreaker

  constructor() {
    // Complex setup with manual configuration
    this.circuitBreaker = new CircuitBreaker(this.processPayment.bind(this), {
      errorThresholdPercentage: 15,
      volumeThreshold: 20,
      rollingCountTimeout: 10000,
      resetTimeout: 30000,
      allowWarmUp: true
    })

    // Manual event handling setup
    this.circuitBreaker.on('open', () => {
      console.error('Circuit breaker opened!')
    })

    this.circuitBreaker.on('close', () => {
      console.log('Circuit breaker closed!')
    })

    this.circuitBreaker.on('halfOpen', () => {
      console.log('Circuit breaker half-open!')
    })

    // Manual fallback configuration
    this.circuitBreaker.fallback(async (args, error) => {
      return this.fallbackPayment(args, error)
    })
  }

  async makePayment(paymentData: PaymentInput) {
    // Ugly manual circuit breaker invocation
    try {
      return await this.circuitBreaker.fire(paymentData)
    } catch (error) {
      // Manual error handling
      throw error
    }
  }

  private async processPayment(paymentData: PaymentInput) {
    // Actual payment logic
    return this.externalPaymentAPI.process(paymentData)
  }

  private async fallbackPayment(args: unknown, error: Error) {
    // Fallback implementation
    return { status: 'queued', message: 'Payment queued for later processing' }
  }
}
```

## Elegant Decorator Solution

The `@CircuitBreaker` decorator eliminates all that complexity:

```typescript
// ✅ BEAUTIFUL: Decorator-based implementation
import { CircuitBreaker, onEvent } from '@/utils/decorators'

export class PaymentService {

  @CircuitBreaker({
    options: {
      errorThresholdPercentage: 15,    // Open after 15% failures
      volumeThreshold: 20,             // Need 20 requests minimum
      rollingCountTimeout: 10000,      // 10s analysis window
      resetTimeout: 30000              // 30s recovery attempt
    },
    circuitGroup: 'payment'
  })
  async makePayment(paymentData: PaymentInput) {
    // Simple method - circuit breaker is automatic!
    return this.externalPaymentAPI.process(paymentData)
  }

  @onEvent({ eventName: 'fallback', circuitGroup: 'payment' })
  async handlePaymentFallback({ input, err }: OnFallbackInput) {
    console.error('Payment failed, using fallback:', err.message)
    return { 
      status: 'queued', 
      message: 'Payment queued for later processing',
      originalInput: input 
    }
  }
}
```

## Advanced Circuit Breaker Configuration

### **Production-Ready Configuration**

The decorator comes with **optimized defaults** for production:

```typescript
const CIRCUIT_CONFIG = {
  ERROR_THRESHOLD_PERCENTAGE: 15,    // Conservative for production
  VOLUME_THRESHOLD: 20,              // Minimum requests for analysis  
  ROLLING_COUNT_TIMEOUT: 10000,      // 10s analysis window
  RESET_TIMEOUT: 30000,              // 30s recovery time
  ALLOW_WARM_UP: true,               // Allow initial warmup
  LOG_THROTTLE_MS: 60000            // 1 min log throttle
}
```

### **Multiple Circuit Groups**

Different services can have different resilience profiles:

```typescript
export class ExternalAPIService {

  @CircuitBreaker({
    options: {
      errorThresholdPercentage: 25,    // More tolerant for external APIs
      volumeThreshold: 10,             // Lower threshold
      resetTimeout: 60000              // Longer recovery time
    },
    circuitGroup: 'external-api'
  })
  async callExternalAPI(data: APIInput) {
    return this.httpClient.post('/api/external', data)
  }

  @CircuitBreaker({
    options: {
      errorThresholdPercentage: 10,    // Less tolerant for critical ops
      volumeThreshold: 50,             // Higher threshold  
      resetTimeout: 15000              // Faster recovery
    },
    circuitGroup: 'critical-ops'
  })
  async criticalOperation(data: CriticalInput) {
    return this.processBusinessCriticalData(data)
  }

  @onEvent({ eventName: 'fallback', circuitGroup: 'external-api' })
  async handleExternalAPIFallback({ input, err }: OnFallbackInput) {
    return { error: 'External service unavailable', retryLater: true }
  }

  @onEvent({ eventName: 'fallback', circuitGroup: 'critical-ops' })
  async handleCriticalOpsFallback({ input, err }: OnFallbackInput) {
    // Alert operations team
    await this.alertService.notifyOps(err)
    return { error: 'Critical operation failed', needsManualIntervention: true }
  }
}
```

## Real-World Integration Examples

### **Database Operations**

```typescript
export class UserRepository {

  @CircuitBreaker({
    options: {
      errorThresholdPercentage: 20,
      volumeThreshold: 30,
      resetTimeout: 45000
    },
    circuitGroup: 'database'
  })
  async findUsersByComplexQuery(filters: ComplexFilters) {
    // Protect against slow/failing database queries
    return this.database.query(this.buildComplexQuery(filters))
  }

  @onEvent({ eventName: 'open', circuitGroup: 'database' })
  async onDatabaseCircuitOpen() {
    console.error('🚨 Database circuit breaker opened - switching to cache')
    await this.alertService.notify('Database circuit breaker opened')
  }

  @onEvent({ eventName: 'fallback', circuitGroup: 'database' })
  async handleDatabaseFallback({ input }: OnFallbackInput) {
    // Try cache or simplified query
    return this.cache.get(`query_fallback_${JSON.stringify(input)}`) || []
  }
}
```

### **Microservices Communication**

```typescript
export class OrderService {

  @CircuitBreaker({
    options: {
      errorThresholdPercentage: 30,    // Microservices can be flaky
      volumeThreshold: 15,
      resetTimeout: 20000
    },
    circuitGroup: 'inventory-service'
  })
  async checkInventory(productId: string) {
    return this.inventoryService.checkAvailability(productId)
  }

  @CircuitBreaker({
    options: {
      errorThresholdPercentage: 15,    // Payment is critical
      volumeThreshold: 25,
      resetTimeout: 60000              // Longer recovery for payment
    },
    circuitGroup: 'payment-service'
  })
  async processPayment(paymentData: PaymentData) {
    return this.paymentService.charge(paymentData)
  }

  @onEvent({ eventName: 'fallback', circuitGroup: 'inventory-service' })
  async handleInventoryFallback() {
    // Assume available if service is down
    return { available: true, stock: 1, source: 'fallback' }
  }

  @onEvent({ eventName: 'fallback', circuitGroup: 'payment-service' })
  async handlePaymentFallback({ input, err }: OnFallbackInput) {
    // Queue payment for retry
    await this.paymentQueue.add('retry-payment', input)
    return { status: 'queued', message: 'Payment will be retried' }
  }
}
```

## Advanced Monitoring & Management

### **Real-Time Metrics**

```typescript
import { getCircuitBreakerMetrics, resetCircuitBreaker } from '@/utils/decorators'

// Get metrics for all circuit breakers
const metrics = getCircuitBreakerMetrics()
console.log(metrics)

// Output:
{
  "PaymentService:makePayment:payment": {
    "state": "CLOSED",
    "stats": {
      "fires": 1250,
      "failures": 45,
      "fallbacks": 12,
      "latencyMean": 234.5,
      "percentiles": { "0.5": 180, "0.95": 890, "0.99": 1200 }
    },
    "config": {
      "errorThresholdPercentage": 15,
      "volumeThreshold": 20,
      "resetTimeout": 30000
    },
    "isOpen": false,
    "isHalfOpen": false
  }
}
```

### **Manual Circuit Control**

```typescript
// Reset a specific circuit breaker
const success = resetCircuitBreaker('PaymentService', 'makePayment', 'payment')

// Health check endpoint using circuit metrics
@Get('health/circuits')
async getCircuitHealth() {
  const metrics = getCircuitBreakerMetrics()
  const unhealthy = Object.entries(metrics)
    .filter(([_, metric]) => metric.isOpen || metric.stats.failures > 100)
  
  return {
    status: unhealthy.length === 0 ? 'healthy' : 'degraded',
    circuits: metrics,
    unhealthyCircuits: unhealthy
  }
}
```

## Circuit Breaker States

### **State Transitions**

```
CLOSED ──[failures exceed threshold]──▶ OPEN
   ▲                                      │
   │                                      │
   └──[success]──── HALF_OPEN ◄──[timeout]
```

### **State Behaviors**

- **CLOSED**: Normal operation, all requests pass through
- **OPEN**: All requests immediately fail with fallback  
- **HALF_OPEN**: Test requests to check if service recovered

## Event-Driven Architecture

### **Available Events**

```typescript
@onEvent({ eventName: 'open' })        // Circuit opened
@onEvent({ eventName: 'close' })       // Circuit closed  
@onEvent({ eventName: 'halfOpen' })    // Circuit testing recovery
@onEvent({ eventName: 'success' })     // Request succeeded
@onEvent({ eventName: 'failure' })     // Request failed
@onEvent({ eventName: 'fallback' })    // Fallback executed
@onEvent({ eventName: 'timeout' })     // Request timed out
```

## Why This Pattern Is Superior

### **🎯 Declarative Simplicity**
- **Single decorator** replaces 50+ lines of boilerplate
- **Clear intent** visible in method signature
- **Zero manual setup** for basic circuit breaking

### **🔧 Sophisticated Management**
- **Automatic instance management** with collision-free keys
- **Event-driven architecture** for custom behavior
- **Built-in metrics collection** for monitoring

### **⚡ Production-Ready Features**
- **Optimized default configuration** for production workloads  
- **Circuit grouping** for different resilience profiles
- **Automatic cleanup** and resource management

### **📊 Advanced Observability**
- **Real-time metrics** with percentile calculations
- **Structured logging** with context information
- **Health check integration** for monitoring systems

The CircuitBreaker decorator **transforms resilience from complex to trivial**, providing enterprise-grade failure protection with the simplicity of a single annotation.