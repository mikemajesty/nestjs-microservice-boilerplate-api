# RequestTimeout Decorator

Simple and elegant decorator that **overrides application timeout settings** on a per-route basis. Works seamlessly with [RequestTimeoutInterceptor](../middlewares/interceptors/request-timeout.interceptor.ts) to provide **granular timeout control** without complex configuration.

## The Timeout Problem

Without per-route timeout control, applications face timeout management issues:

```typescript
// ❌ PROBLEM: One timeout for all routes
app.useGlobalInterceptors(new RequestTimeoutInterceptor(30000)) // 30s for everything

@Post('quick-operation')  
async quickOp() {
  // Fast operation limited by global 30s timeout
  return this.service.quickProcess()
}

@Post('heavy-report')
async generateReport() {
  // Heavy operation that needs more than 30s - will timeout!
  return this.service.generateLargeReport() // Takes 2 minutes
}
```

## Simple Timeout Override

The `@RequestTimeout` decorator provides **effortless timeout customization**:

```typescript
import { RequestTimeout } from '@/utils/decorators'

@Controller('operations')
export class OperationController {
  
  @Post('quick-operation')
  @RequestTimeout(5000) // 5 seconds - faster than default
  async quickOp() {
    return this.service.quickProcess()
  }

  @Post('heavy-report')  
  @RequestTimeout(180000) // 3 minutes - longer than default
  async generateReport() {
    return this.service.generateLargeReport()
  }

  @Post('standard-operation')
  // No decorator = uses global timeout
  async standardOp() {
    return this.service.standardProcess()
  }
}
```

## How It Works with RequestTimeoutInterceptor

### **Timeout Resolution Hierarchy**

The [RequestTimeoutInterceptor](../middlewares/interceptors/request-timeout.interceptor.ts) follows this priority order:

```typescript
const finalTimeout = requestTimeout ?? this.globalTimeout ?? DEFAULT_FALLBACK_TIMEOUT

// 1. requestTimeout    - From @RequestTimeout decorator (highest priority)
// 2. globalTimeout     - Global interceptor configuration  
// 3. DEFAULT_FALLBACK  - 60 seconds (fallback safety)
```

### **Integration Example**

```typescript
// app.module.ts - Global interceptor setup
@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useFactory: () => new RequestTimeoutInterceptor(undefined, 30000), // 30s global
    }
  ]
})
export class AppModule {}

// controller.ts - Route-specific overrides
@Controller('files')
export class FileController {
  
  @Get('list')
  // Uses global 30s timeout
  async listFiles() {
    return this.fileService.list()
  }

  @Post('upload')
  @RequestTimeout(120000) // Override: 2 minutes for uploads
  async uploadFile(@Body() file: FileDto) {
    return this.fileService.upload(file)
  }

  @Post('process')
  @RequestTimeout(300000) // Override: 5 minutes for processing  
  async processFile(@Body() data: ProcessDto) {
    return this.fileService.process(data)
  }
}
```

## Real-World Usage Patterns

### **API Response Time Optimization**

```typescript
@Controller('api')
export class ApiController {
  
  @Get('health')
  @RequestTimeout(2000) // Health checks must be fast
  async healthCheck() {
    return { status: 'ok' }
  }

  @Get('user-profile')
  @RequestTimeout(10000) // User data should load quickly
  async getUserProfile(@Param('id') id: string) {
    return this.userService.getProfile(id)
  }

  @Post('generate-report')
  @RequestTimeout(600000) // Reports can take up to 10 minutes
  async generateReport(@Body() params: ReportParams) {
    return this.reportService.generate(params)
  }
}
```

### **Error Handling**

When timeout occurs, the interceptor automatically converts errors:

```typescript
// Timeout exceeded response
{
  "statusCode": 408,
  "message": "Request Timeout. Limit: 30000ms exceeded.",
  "error": "Request Timeout"
}
```

## Implementation Benefits

### **🎯 Granular Control**
- **Route-specific timeouts** instead of global limits
- **Per-operation optimization** based on expected duration
- **Flexible timeout management** without code complexity

### **⚡ Simple API**
- **Single decorator** to override timeout
- **No configuration objects** or complex setup
- **Millisecond precision** for exact timeout control

### **🛡️ Automatic Error Handling**
- **Consistent timeout exceptions** across application
- **Clear error messages** with actual timeout values
- **RxJS timeout operator** for reliable timeout detection

### **🔧 Seamless Integration**
- **Works with existing interceptor** setup
- **Metadata-based configuration** using NestJS patterns
- **Reflector integration** for automatic metadata extraction

## Why This Pattern Works

The combination of `@RequestTimeout` decorator + `RequestTimeoutInterceptor` provides:

1. **Simplicity**: Just add `@RequestTimeout(ms)` to any route
2. **Flexibility**: Different timeouts for different operations  
3. **Maintainability**: Clear timeout intentions in controller code
4. **Consistency**: Unified timeout handling across the application

This decorator **eliminates the need for complex timeout configuration** while providing powerful per-route timeout control, making timeout management as simple as adding a single line of code.