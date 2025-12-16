# LogExecutionTime Decorator

Simple performance monitoring decorator that **measures and logs method execution time** with high precision. Perfect for identifying performance bottlenecks and monitoring critical operations without complex APM tools.

## The Performance Monitoring Problem

Without execution time monitoring, developers struggle to identify slow methods:

```typescript
// ❌ PROBLEM: No visibility into method performance
export class UserService {
  async createUser(userData: CreateUserInput) {
    // Is this method slow? How slow?
    const user = await this.userRepository.create(userData)
    await this.emailService.sendWelcomeEmail(user.email)
    await this.auditService.logUserCreation(user.id)
    // No way to know which step is causing delays
    return user
  }

  async generateReport(params: ReportParams) {
    // Complex operation - is it getting slower over time?
    const data = await this.dataService.fetchReportData(params)
    const processed = await this.processingService.processData(data)
    const report = await this.reportService.generatePDF(processed)
    // No performance insights
    return report
  }
}
```

## Simple Execution Time Monitoring

The `@LogExecutionTime` decorator provides **instant performance visibility**:

```typescript
import { LogExecutionTime } from '@/utils/decorators'

export class UserService {
  
  @LogExecutionTime
  async createUser(userData: CreateUserInput) {
    const user = await this.userRepository.create(userData)
    await this.emailService.sendWelcomeEmail(user.email)
    await this.auditService.logUserCreation(user.id)
    return user
  }
  // Output: Function UserService/createUser took 245.123ms to execute.

  @LogExecutionTime
  async generateReport(params: ReportParams) {
    const data = await this.dataService.fetchReportData(params)
    const processed = await this.processingService.processData(data)
    const report = await this.reportService.generatePDF(processed)
    return report
  }
  // Output: Function UserService/generateReport took 3247.891ms to execute.
}
```

## Real-World Performance Monitoring

### **Identifying Slow Operations**

```typescript
export class CatService {
  
  @LogExecutionTime
  async createCat(catData: CreateCatInput) {
    // Monitor cat creation performance
    const cat = await this.catRepository.create(catData)
    await this.cacheService.invalidateList('cats')
    return cat
  }
  // Output: Function CatService/createCat took 89.456ms to execute.

  @LogExecutionTime  
  async searchCats(criteria: SearchCriteria) {
    // Track search performance with different criteria
    return this.catRepository.searchWithFilters(criteria)
  }
  // Output: Function CatService/searchCats took 1234.567ms to execute.

  @LogExecutionTime
  async bulkImportCats(catsData: CreateCatInput[]) {
    // Monitor bulk operations
    return this.catRepository.bulkInsert(catsData)
  }
  // Output: Function CatService/bulkImportCats took 5678.912ms to execute.
}
```

### **Use Case Monitoring**

```typescript
export class CreateUserUseCase {
  
  @LogExecutionTime
  async execute(userData: CreateUserInput) {
    // Monitor complete use case performance
    await this.validateUser(userData)
    const user = await this.userRepository.create(userData)
    await this.sendWelcomeEmail(user)
    await this.createUserProfile(user.id)
    return user
  }
  // Output: Function CreateUserUseCase/execute took 892.345ms to execute.
}
```

## High-Precision Measurement

### **Performance API Integration**

```typescript
// Uses Node.js performance.now() for microsecond precision
const start = performance.now()    // High-resolution timestamp
const result = await originalMethod.apply(this, args)
const end = performance.now()      // High-resolution timestamp
const duration = (end - start).toFixed(3)  // Precise to 3 decimal places
```

### **Formatted Output**

```typescript
// Colored output for better visibility
LoggerService.log(yellow(`Function ${className}/${methodName} took ${duration}ms to execute.`))

// Example outputs:
// Function UserService/createUser took 245.123ms to execute.
// Function CatRepository/findWithFilters took 1.456ms to execute.  
// Function ReportService/generatePDF took 12345.678ms to execute.
```

## Performance Benefits

### **🔍 Instant Performance Insights**
- **Zero configuration** performance monitoring
- **Method-level precision** shows exactly what's slow
- **Real-time feedback** during development and testing

### **⚡ Lightweight Implementation**  
- **Minimal overhead** using native performance API
- **Non-intrusive** - doesn't affect method behavior
- **High precision** timing with microsecond accuracy

### **🛠️ Development Productivity**
- **Quick bottleneck identification** in complex operations
- **Performance regression detection** during development
- **Optimization guidance** for critical paths

### **📊 Production Monitoring**
- **Live performance tracking** in production logs
- **Trend analysis** over time
- **Performance baseline** establishment

## When to Use

### **✅ Perfect For:**
```typescript
// Critical business operations
@LogExecutionTime
async processPayment(paymentData: PaymentInput) { }

// Database operations
@LogExecutionTime  
async complexQuery(filters: QueryFilters) { }

// External API calls
@LogExecutionTime
async fetchUserData(userId: string) { }

// Heavy computations
@LogExecutionTime
async generateAnalytics(params: AnalyticsParams) { }
```

### **❌ Avoid For:**
```typescript
// Simple getters (too much log noise)
getName(): string { return this.name }

// Trivial operations
validateEmail(email: string): boolean { }

// High-frequency methods (log spam)
incrementCounter(): number { }
```

## Why This Pattern Works

The `@LogExecutionTime` decorator **solves the performance visibility problem** with:

1. **Simplicity**: Just add `@LogExecutionTime` to any method
2. **Precision**: High-resolution performance measurement  
3. **Clarity**: Clear className/methodName identification
4. **Non-invasive**: Doesn't change method behavior or signatures

This decorator **transforms performance monitoring from complex to trivial**, making it easy to identify bottlenecks and monitor critical operations with a single line of code.