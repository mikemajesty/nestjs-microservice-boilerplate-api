# Axios

Enhanced Axios utilities that solve common HTTP client issues: messy stack traces, difficult debugging, and unreliable network requests. These utilities transform Axios from a basic HTTP client into a **production-ready, resilient communication tool**.

## The Stack Trace Problem

### Why interceptAxiosResponseError Exists

Axios has a **notorious problem**: its error stack traces are cluttered with internal Node.js and library code that makes debugging nearly impossible. Here's what you typically get:

```
AxiosError: Request failed with status code 404
    at settle (/node_modules/axios/lib/core/settle.js:19:12)
    at IncomingMessage.handleStreamEnd (/node_modules/axios/lib/adapters/http.js:236:11)
    at IncomingMessage.emit (node:events:525:35)
    at endReadableNT (node:internal/streams/readable:1359:12)
    at process.processTicksAndRejections (node:internal/process/task_queues:82:21)
    at AxiosError.create (/node_modules/axios/lib/core/AxiosError.js:51:18)
    at AxiosError.from (/node_modules/axios/lib/core/AxiosError.js:79:14)
```

**None of this helps you debug your actual API call!** 

### Clean Stack Traces with axiosBetterStacktrace

`interceptAxiosResponseError` solves this by:

🧹 **Cleaning Stack Traces**: Removes all the internal Axios/Node.js noise  
🎯 **Smart Error Extraction**: Intelligently finds status codes and messages  
🔍 **cURL Generation**: Adds executable cURL commands for easy debugging  
⚡ **Enhanced Error Objects**: Provides consistent error structure

## Intelligent Error Processing

### Status Code Extraction Strategy

```typescript
// Tries multiple locations to find the actual status code
const statusCandidates = [
  error.response?.data?.code,      // API-specific error code
  error.response?.data?.error?.code, // Nested error structures  
  error.response?.status,          // HTTP status code
  error.status,                    // Direct status property
  500                             // Fallback for unknown errors
]
```

### Message Extraction Strategy

```typescript
// Prioritized message extraction for user-friendly errors
const messageCandidates = [
  error.response?.data?.description,    // Detailed API description
  error.response?.data?.error?.message, // Nested error message
  error.response?.data?.message,        // Standard message field
  error.response?.statusText,           // HTTP status text
  error.message,                        // Axios error message
  'Internal Server Error'               // Ultimate fallback
]
```

## Production-Ready HTTP Client Setup

Here's how to configure Axios with both utilities for maximum reliability and debuggability:

### Basic Setup with Error Handling

```typescript
import axios, { AxiosInstance } from 'axios'
import { AxiosUtils } from '@/utils/axios'
import { ILoggerAdapter } from '@/infra/logger'

export class PaymentGatewayClient {
  private client: AxiosInstance
  
  constructor(private logger: ILoggerAdapter) {
    this.client = axios.create({
      baseURL: 'https://api.paymentgateway.com',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PAYMENT_API_TOKEN}`
      }
    })

    // Add enhanced error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        // Clean stack traces and enhance error object
        AxiosUtils.interceptAxiosResponseError(error)
        return Promise.reject(error)
      }
    )

    // Add automatic retry logic
    AxiosUtils.requestRetry({
      axios: this.client,
      logger: this.logger,
      status: [503, 422, 408, 429, 502, 504] // Payment gateway specific retry codes
    })
  }
}
```

### Advanced Configuration with Custom Retry Strategy

```typescript
export class ExternalAPIService {
  private client: AxiosInstance

  constructor(private logger: ILoggerAdapter) {
    this.client = axios.create({
      baseURL: process.env.EXTERNAL_API_URL,
      timeout: 15000
    })

    // Enhanced error handling with debugging
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        AxiosUtils.interceptAxiosResponseError(error)
        
        // Log the cURL command for easy debugging
        this.logger.error({
          message: 'External API request failed',
          obj: {
            url: error.config?.url,
            method: error.config?.method,
            status: error.status,
            curl: error.curl, // Generated cURL command
            message: error.message
          }
        })
        
        return Promise.reject(error)
      }
    )

    // Aggressive retry for critical external service
    AxiosUtils.requestRetry({
      axios: this.client,
      logger: this.logger,
      status: [408, 429, 500, 502, 503, 504] // Retry on timeouts and server errors
    })
  }

  async syncUserData(userId: string): Promise<ExternalUserData> {
    try {
      const response = await this.client.get(`/users/${userId}`)
      return response.data
    } catch (error) {
      // Error already enhanced by interceptor
      throw createExceptionFromStatus({
        status: error.status,
        message: 'externalUserSyncFailed',
        parameters: {
          context: 'ExternalAPIService.syncUserData',
          details: [{ 
            userId,
            curl: error.curl, // Include cURL in error details for support team
            externalMessage: error.message
          }]
        },
        originalStack: error.stack
      })
    }
  }
}
```

## Retry Logic Configuration

### Smart Retry Conditions

The `requestRetry` utility automatically retries requests based on intelligent conditions:

```typescript
// Network-level errors (connection issues)
const networkErrors = ['ECONNABORTED', 'ECONNRESET', 'ETIMEDOUT']

// Configurable status codes that warrant retry
const defaultRetryStatuses = [503, 422, 408, 429] // Service unavailable, timeout, rate limit

// All 5xx server errors (server-side issues)
const serverErrors = status >= 500 && status < 600
```

### Exponential Backoff with Jitter

Prevents thundering herd problems with smart retry timing:

```typescript
// Exponential backoff: 2^retryCount * 1000ms
// Plus random jitter: 0-1000ms
const baseDelay = Math.pow(2, retryCount) * 1000  // 1s, 2s, 4s, 8s
const jitter = Math.random() * 1000              // Random 0-1s
const totalDelay = baseDelay + jitter             // Final delay

// Retry 1: ~1-2 seconds
// Retry 2: ~2-3 seconds  
// Retry 3: ~4-5 seconds
```

### Microservice Integration Example

```typescript
export class UserServiceClient {
  private client: AxiosInstance

  constructor(private logger: ILoggerAdapter) {
    this.client = axios.create({
      baseURL: process.env.USER_SERVICE_URL,
      timeout: 10000
    })

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        AxiosUtils.interceptAxiosResponseError(error)
        return Promise.reject(error)
      }
    )

    // Microservice-specific retry strategy
    AxiosUtils.requestRetry({
      axios: this.client,
      logger: this.logger,
      status: [503, 408, 429] // Only retry service unavailable, timeout, rate limit
    })
  }

  async createUser(userData: CreateUserData): Promise<UserServiceResponse> {
    try {
      const response = await this.client.post('/users', userData)
      return response.data
    } catch (error) {
      // Enhanced error with clean stack trace and cURL
      this.logger.error({
        message: 'User creation failed in User Service',
        obj: {
          userData: { ...userData, password: '[REDACTED]' },
          curl: error.curl,
          status: error.status,
          retryAttempts: error.config['axios-retry']?.retryCount || 0
        }
      })

      throw createExceptionFromStatus({
        status: error.status,
        message: 'userServiceCreateFailed',
        parameters: {
          context: 'UserServiceClient.createUser',
          details: [{ 
            microservice: 'UserService',
            operation: 'create',
            curl: error.curl
          }]
        }
      })
    }
  }
}
```

## The cURL Generation Advantage

### Debugging Made Easy

When an HTTP request fails, you get a **ready-to-execute cURL command**:

```bash
# Generated cURL (with sensitive data filtered)
curl -X POST 'https://api.payment.com/charges' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer [FILTERED]' \
  -d '{"amount":2500,"currency":"BRL","customer":"cust_123"}'
```

### Support Team Benefits

```typescript
// Support ticket with actionable debugging info
{
  "error": "Payment processing failed",
  "details": {
    "curl": "curl -X POST 'https://api.stripe.com/v1/charges' -H 'Authorization: Bearer [FILTERED]' -d 'amount=2500'",
    "status": 402,
    "message": "Your card was declined",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### Development Workflow

1. **API call fails** in development
2. **Copy cURL from logs** 
3. **Paste in terminal** to reproduce exact request
4. **Modify and test** until working
5. **Update code** with correct implementation

## Real-World Integration Pattern

```typescript
export class APIClientFactory {
  static createResilientClient(
    baseURL: string, 
    logger: ILoggerAdapter,
    options: ClientOptions = {}
  ): AxiosInstance {
    
    const client = axios.create({
      baseURL,
      timeout: options.timeout || 15000,
      ...options.axiosConfig
    })

    // Always add enhanced error handling
    client.interceptors.response.use(
      (response) => response,
      (error) => {
        AxiosUtils.interceptAxiosResponseError(error)
        
        logger.error({
          message: 'HTTP request failed',
          obj: {
            service: baseURL,
            curl: error.curl,
            status: error.status,
            duration: Date.now() - error.config.metadata?.startTime
          }
        })
        
        return Promise.reject(error)
      }
    )

    // Add timing metadata
    client.interceptors.request.use(config => {
      config.metadata = { startTime: Date.now() }
      return config
    })

    // Configure retry based on service type
    AxiosUtils.requestRetry({
      axios: client,
      logger,
      status: options.retryStatuses || [503, 408, 429]
    })

    return client
  }
}

// Usage across different services
const paymentClient = APIClientFactory.createResilientClient(
  'https://api.stripe.com',
  logger,
  { retryStatuses: [503, 408, 429, 502] }
)

const internalServiceClient = APIClientFactory.createResilientClient(
  'http://user-service:3001', 
  logger,
  { retryStatuses: [503, 408], timeout: 5000 }
)
```

## Benefits Summary

### 🔍 **Enhanced Debugging**
- **Clean stack traces** without library noise
- **Executable cURL commands** for immediate reproduction
- **Intelligent error extraction** from various response formats

### 🛡️ **Production Resilience** 
- **Automatic retry logic** with exponential backoff
- **Smart retry conditions** based on error types
- **Configurable retry strategies** per service

### 👥 **Team Productivity**
- **Consistent error handling** across all HTTP clients
- **Actionable debugging information** in logs
- **Easy troubleshooting** with cURL commands
- **Reduced debugging time** from hours to minutes

### 📈 **Operational Benefits**
- **Reduced false alarms** from transient network issues
- **Better error reporting** with context and reproduction steps
- **Improved system resilience** through intelligent retries
- **Enhanced monitoring** with structured error logs