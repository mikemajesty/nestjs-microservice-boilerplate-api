# Metrics Service

Powerful **OpenTelemetry-based metrics collection** service that automatically sends application metrics to **Prometheus** and **Grafana**. This library provides both **automatic API metrics** out-of-the-box and the ability to create **custom business metrics** for deep application observability.

## The Power of Observability

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Your App      │────▶│  OpenTelemetry   │────▶│   Prometheus    │────▶│    Grafana      │
│  (NestJS API)   │     │    Collector     │     │   (Storage)     │     │  (Dashboards)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                        │                       │
   Custom Metrics          Batch & Export           Time-Series           Visualization
   Auto API Metrics        Processing              Database              Alerting
   Host Metrics            Aggregation             Querying              Analysis
```

### Why Metrics Matter

- **🔍 Real-Time Visibility** - Know exactly what's happening in your application
- **📈 Performance Tracking** - Identify bottlenecks before they become problems
- **🚨 Proactive Alerting** - Get notified when things go wrong
- **📊 Business Intelligence** - Track business KPIs alongside technical metrics
- **🔬 Root Cause Analysis** - Correlate metrics with logs and traces

## Built-in Metrics (Zero Configuration)

The module automatically collects these metrics without any code:

### API Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `http_request_duration_seconds` | Histogram | Request latency distribution |
| `http_requests_total` | Counter | Total HTTP requests count |
| `http_request_size_bytes` | Histogram | Request body size |
| `http_response_size_bytes` | Histogram | Response body size |
| `http_active_requests` | UpDownCounter | Currently processing requests |

### Host Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `process_cpu_seconds_total` | Counter | CPU time consumed |
| `process_resident_memory_bytes` | Gauge | Memory usage |
| `nodejs_eventloop_lag_seconds` | Gauge | Event loop latency |
| `nodejs_active_handles` | Gauge | Active handles count |
| `nodejs_heap_size_bytes` | Gauge | V8 heap memory |

## Custom Metrics API

Beyond automatic metrics, you can create **custom business metrics** tailored to your application needs.

### Available Metric Types

| Type | Use Case | Example |
|------|----------|---------|
| **Counter** | Things that only go up | Total orders, logins, errors |
| **UpDownCounter** | Things that go up AND down | Active users, queue size |
| **Histogram** | Distribution of values | Response times, order amounts |
| **ObservableCounter** | Async counter (callback-based) | External API calls |
| **ObservableGauge** | Point-in-time values | Temperature, stock price |
| **ObservableUpDownCounter** | Async up/down counter | Connection pool size |

## Real-World Examples

### Example 1: E-Commerce Order Tracking

```typescript
import { Injectable } from '@nestjs/common'
import { IMetricsAdapter } from '@/libs/metrics'

@Injectable()
export class OrderService {
  private readonly ordersCounter
  private readonly orderAmountHistogram
  private readonly activeCartsGauge

  constructor(private readonly metrics: IMetricsAdapter) {
    // Counter: Total orders placed (only increases)
    this.ordersCounter = this.metrics.getCounter('ecommerce_orders_total', {
      description: 'Total number of orders placed',
      unit: 'orders'
    })

    // Histogram: Distribution of order values
    this.orderAmountHistogram = this.metrics.getHistogram('ecommerce_order_amount', {
      description: 'Order amount distribution',
      unit: 'USD',
      advice: {
        explicitBucketBoundaries: [10, 50, 100, 250, 500, 1000, 5000]
      }
    })

    // UpDownCounter: Active shopping carts
    this.activeCartsGauge = this.metrics.getUpDownCounter('ecommerce_active_carts', {
      description: 'Number of active shopping carts',
      unit: 'carts'
    })
  }

  async placeOrder(order: Order): Promise<void> {
    // Record the order
    this.ordersCounter.add(1, {
      payment_method: order.paymentMethod,
      country: order.country,
      category: order.category
    })

    // Record order amount for histogram
    this.orderAmountHistogram.record(order.totalAmount, {
      currency: 'USD',
      customer_type: order.isNewCustomer ? 'new' : 'returning'
    })

    // Decrease active carts (cart converted to order)
    this.activeCartsGauge.add(-1)
  }

  async createCart(): Promise<void> {
    this.activeCartsGauge.add(1)
  }

  async abandonCart(): Promise<void> {
    this.activeCartsGauge.add(-1, { reason: 'abandoned' })
  }
}
```

**Grafana Query Examples:**
```promql
# Orders per minute by payment method
rate(ecommerce_orders_total[1m])

# Average order value
histogram_quantile(0.5, rate(ecommerce_order_amount_bucket[5m]))

# Active carts right now
ecommerce_active_carts
```

### Example 2: User Authentication Metrics

```typescript
@Injectable()
export class AuthService {
  private readonly loginCounter
  private readonly loginDurationHistogram
  private readonly activeSessionsGauge
  private readonly failedLoginCounter

  constructor(private readonly metrics: IMetricsAdapter) {
    this.loginCounter = this.metrics.getCounter('auth_logins_total', {
      description: 'Total login attempts'
    })

    this.loginDurationHistogram = this.metrics.getHistogram('auth_login_duration_seconds', {
      description: 'Time to complete login',
      unit: 'seconds',
      advice: {
        explicitBucketBoundaries: [0.1, 0.25, 0.5, 1, 2.5, 5, 10]
      }
    })

    this.activeSessionsGauge = this.metrics.getUpDownCounter('auth_active_sessions', {
      description: 'Currently active user sessions'
    })

    this.failedLoginCounter = this.metrics.getCounter('auth_failed_logins_total', {
      description: 'Failed login attempts'
    })
  }

  async login(credentials: LoginInput): Promise<LoginOutput> {
    const startTime = Date.now()
    
    try {
      const result = await this.performLogin(credentials)
      
      // Record successful login
      this.loginCounter.add(1, { 
        status: 'success',
        method: credentials.method // 'password', 'oauth', '2fa'
      })
      
      // Record login duration
      const duration = (Date.now() - startTime) / 1000
      this.loginDurationHistogram.record(duration)
      
      // Increase active sessions
      this.activeSessionsGauge.add(1)
      
      return result
    } catch (error) {
      // Record failed login
      this.failedLoginCounter.add(1, {
        reason: error.code, // 'invalid_password', 'user_not_found', 'account_locked'
        method: credentials.method
      })
      throw error
    }
  }

  async logout(token: string): Promise<void> {
    await this.invalidateToken(token)
    this.activeSessionsGauge.add(-1)
  }
}
```

**Grafana Alerts:**
```yaml
# Alert when failed logins spike
- alert: HighFailedLoginRate
  expr: rate(auth_failed_logins_total[5m]) > 10
  for: 2m
  labels:
    severity: warning
  annotations:
    summary: "High rate of failed logins detected"
```

### Example 3: External API Integration Metrics

```typescript
@Injectable()
export class PaymentGatewayService {
  private readonly apiCallsCounter
  private readonly apiLatencyHistogram
  private readonly apiErrorsCounter

  constructor(private readonly metrics: IMetricsAdapter) {
    this.apiCallsCounter = this.metrics.getCounter('payment_gateway_calls_total', {
      description: 'Total calls to payment gateway'
    })

    this.apiLatencyHistogram = this.metrics.getHistogram('payment_gateway_latency_seconds', {
      description: 'Payment gateway response time',
      unit: 'seconds',
      advice: {
        explicitBucketBoundaries: [0.1, 0.5, 1, 2, 5, 10, 30]
      }
    })

    this.apiErrorsCounter = this.metrics.getCounter('payment_gateway_errors_total', {
      description: 'Payment gateway errors'
    })
  }

  async processPayment(payment: PaymentInput): Promise<PaymentResult> {
    const startTime = Date.now()
    
    try {
      const result = await this.gateway.charge(payment)
      
      this.apiCallsCounter.add(1, {
        gateway: 'stripe',
        operation: 'charge',
        status: 'success'
      })
      
      const latency = (Date.now() - startTime) / 1000
      this.apiLatencyHistogram.record(latency, {
        gateway: 'stripe',
        operation: 'charge'
      })
      
      return result
    } catch (error) {
      this.apiErrorsCounter.add(1, {
        gateway: 'stripe',
        operation: 'charge',
        error_type: error.type // 'timeout', 'declined', 'network'
      })
      throw error
    }
  }
}
```

### Example 4: Queue Processing Metrics

```typescript
@Injectable()
export class JobQueueService {
  private readonly jobsProcessedCounter
  private readonly jobDurationHistogram
  private readonly queueSizeGauge
  private readonly jobsFailedCounter

  constructor(private readonly metrics: IMetricsAdapter) {
    this.jobsProcessedCounter = this.metrics.getCounter('queue_jobs_processed_total', {
      description: 'Total jobs processed'
    })

    this.jobDurationHistogram = this.metrics.getHistogram('queue_job_duration_seconds', {
      description: 'Job processing time',
      advice: {
        explicitBucketBoundaries: [1, 5, 10, 30, 60, 300, 600]
      }
    })

    this.queueSizeGauge = this.metrics.getUpDownCounter('queue_size', {
      description: 'Current queue size'
    })

    this.jobsFailedCounter = this.metrics.getCounter('queue_jobs_failed_total', {
      description: 'Failed jobs'
    })
  }

  async enqueue(job: Job): Promise<void> {
    await this.queue.add(job)
    this.queueSizeGauge.add(1, { queue: job.queueName })
  }

  async process(job: Job): Promise<void> {
    const startTime = Date.now()
    this.queueSizeGauge.add(-1, { queue: job.queueName })
    
    try {
      await job.execute()
      
      this.jobsProcessedCounter.add(1, {
        queue: job.queueName,
        type: job.type,
        status: 'success'
      })
      
      const duration = (Date.now() - startTime) / 1000
      this.jobDurationHistogram.record(duration, {
        queue: job.queueName,
        type: job.type
      })
    } catch (error) {
      this.jobsFailedCounter.add(1, {
        queue: job.queueName,
        type: job.type,
        error: error.name
      })
    }
  }
}
```

## Infrastructure Architecture

### Data Flow Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              YOUR APPLICATION                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Counter   │  │  Histogram  │  │UpDownCounter│  │   Gauge     │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         └─────────────────┼─────────────────┼─────────────────┘              │
│                           ▼                                                  │
│              ┌─────────────────────────┐                                    │
│              │   OpenTelemetry SDK     │                                    │
│              │   (nestjs-otel)         │                                    │
│              └───────────┬─────────────┘                                    │
└──────────────────────────┼──────────────────────────────────────────────────┘
                           │ OTLP (gRPC :4317)
                           ▼
              ┌─────────────────────────┐
              │   OpenTelemetry         │
              │   Collector             │
              │   (otel-collector)      │
              └───────────┬─────────────┘
                          │ Prometheus format (:9464)
                          ▼
              ┌─────────────────────────┐
              │   Prometheus            │
              │   (Time-Series DB)      │
              │   Port: 9090            │
              └───────────┬─────────────┘
                          │ PromQL queries
                          ▼
              ┌─────────────────────────┐
              │   Grafana               │
              │   (Visualization)       │
              │   Port: 3000            │
              └─────────────────────────┘
```

### Docker Services

| Service | Port | Purpose |
|---------|------|---------|
| **collector** | 4317 (gRPC), 4318 (HTTP) | Receives and processes metrics |
| **prometheus** | 9090 | Stores time-series data |
| **grafana** | 3000 | Dashboards and visualization |
| **alertmanager** | 9093 | Alert routing and notification |

## Module Configuration

The module comes pre-configured with sensible defaults:

```typescript
// src/libs/metrics/module.ts
const OpenTelemetryModuleConfig = OpenTelemetryModule.forRoot({
  metrics: {
    hostMetrics: true,       // CPU, memory, event loop
    apiMetrics: {
      enable: true,          // HTTP request metrics
      ignoreRoutes: ['/favicon.ico'],
      ignoreUndefinedRoutes: false
    }
  }
})
```

### Integration in Your Module

```typescript
import { MetricsLibModule, IMetricsAdapter } from '@/libs/metrics'

@Module({
  imports: [MetricsLibModule],
  providers: [
    {
      provide: OrderService,
      useFactory: (metrics: IMetricsAdapter) => new OrderService(metrics),
      inject: [IMetricsAdapter]
    }
  ]
})
export class OrderModule {}
```

## Best Practices

### Naming Conventions

```typescript
// ✅ Good: Descriptive, namespaced, with units
'ecommerce_orders_total'
'auth_login_duration_seconds'
'payment_gateway_latency_seconds'

// ❌ Bad: Vague, no namespace, missing units
'orders'
'login_time'
'latency'
```

### Label Cardinality

```typescript
// ✅ Good: Low cardinality labels
this.counter.add(1, {
  status: 'success',      // Few possible values
  method: 'POST',         // Limited HTTP methods
  country: 'US'           // Finite countries
})

// ❌ Bad: High cardinality labels (will explode Prometheus storage)
this.counter.add(1, {
  user_id: '12345',       // Millions of users
  request_id: 'uuid...',  // Infinite values
  timestamp: Date.now()   // Always unique
})
```

### Histogram Buckets

```typescript
// Choose buckets based on expected distribution
this.metrics.getHistogram('http_request_duration_seconds', {
  advice: {
    // For fast APIs (< 1s expected)
    explicitBucketBoundaries: [0.01, 0.05, 0.1, 0.25, 0.5, 1]
  }
})

this.metrics.getHistogram('batch_job_duration_seconds', {
  advice: {
    // For long-running jobs (minutes expected)
    explicitBucketBoundaries: [1, 5, 10, 30, 60, 300, 600, 1800]
  }
})
```

## Grafana Dashboard Examples

### Request Rate Panel

```promql
# Requests per second
rate(http_requests_total[1m])

# Requests per second by endpoint
sum(rate(http_requests_total[1m])) by (route)

# Error rate percentage
sum(rate(http_requests_total{status_code=~"5.."}[5m])) 
/ sum(rate(http_requests_total[5m])) * 100
```

### Latency Panel

```promql
# 50th percentile (median)
histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))

# 95th percentile
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# 99th percentile
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))
```

### Custom Business Metrics

```promql
# Revenue per minute
sum(rate(ecommerce_order_amount_sum[1m]))

# Orders by country (pie chart)
sum(ecommerce_orders_total) by (country)

# Active sessions over time
auth_active_sessions
```

## Summary

| Feature | Description |
|---------|-------------|
| **Automatic Collection** | Host + API metrics with zero code |
| **Custom Metrics** | Counter, Histogram, Gauge, UpDownCounter |
| **Full Pipeline** | App → Collector → Prometheus → Grafana |
| **Alerting Ready** | Prometheus AlertManager integration |
| **OpenTelemetry Standard** | Industry-standard observability |
| **Type-Safe** | Full TypeScript support |

**Metrics Service** - *Complete observability for your NestJS application with Prometheus and Grafana integration.*
