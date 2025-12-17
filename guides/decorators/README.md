# Decorators Documentation

**Comprehensive documentation for all decorators in the NestJS Microservice Boilerplate API.** This collection of decorators transforms complex, boilerplate-heavy operations into elegant, type-safe, single-line annotations.

## 🚀 **Why These Decorators Are Game-Changing**

These decorators solve **real-world problems** by eliminating boilerplate code, adding type safety, and providing consistent APIs across the entire application. Each decorator transforms manual, error-prone implementations into elegant, automated solutions.

## 📋 **Available Decorators**

### **🛡️ Validation & Security**

#### **[ValidateSchema](validate-schema.md)** | **[📄 Code](../../src/utils/decorators/validate-schema.decorator.ts)**
**Mandatory Zod validation for all use cases.** Transforms manual parameter validation into automatic, type-safe schema validation with multi-parameter support and consistent error handling.

#### **[Permission](permission.md)** | **[📄 Code](../../src/utils/decorators/role.decorator.ts)**
**Role-based authorization system.** Elegant authorization decorator that enforces resource:action permissions through User→Role→Permission flow with database integration.

---

### **⚡ Performance & Resilience**

#### **[RequestTimeout](request-timeout.md)** | **[📄 Code](../../src/utils/decorators/request-timeout.decorator.ts)**
**Method-level timeout control.** Simple decorator that overrides default timeouts for specific operations, integrating seamlessly with RequestTimeoutInterceptor.

#### **[LogExecutionTime](log-execution-time.md)** | **[📄 Code](../../src/utils/decorators/log-execution-time.decorator.ts)**
**High-precision performance monitoring.** Automatic execution time logging with colorized output and millisecond precision for performance analysis.

#### **[CircuitBreaker](circuit-breaker.md)** | **[📄 Code](../../src/utils/decorators/circuit-breaker.decorator.ts)**
**Elegant circuit breaker wrapper.** Transforms complex Opossum circuit breaker setup into simple decorator annotations with circuit groups, metrics, and event handling.

---

### **🔄 Parallel Processing**

#### **[Thread Decorator](thread.md)** | **[📄 Code](../../src/utils/decorators/workers/thread.decorator.ts)**
**CPU-intensive operations in worker threads.** Non-blocking execution for mathematical computations, data analysis, image processing, and text analysis with true parallelism.

#### **[Process Decorator](process.md)** | **[📄 Code](../../src/utils/decorators/process/process.decorator.ts)**
**Memory-intensive operations in child processes.** Complete memory isolation for document processing, large file operations, ML training, and memory-heavy tasks.

---

### **🗄️ Database Optimization**

#### **[ValidateDatabaseSortAllowed](validate-database-sort-allowed.md)** | **[📄 Code](../../src/utils/decorators/database/validate-database-sort-allowed.decorator.ts)**
**Type-safe sorting validation for repositories.** Automatic sort object generation with field whitelisting, custom mapping, and type-safe validation for pagination methods.

#### **[ConvertTypeOrmFilter](convert-typeorm-filter.md)** | **[📄 Code](../../src/utils/decorators/database/postgres/validate-typeorm-filter.decorator.ts)**
**Automatic TypeORM WHERE clause generation.** Transforms manual filter construction into elegant, type-safe PostgreSQL queries with unaccent support and automatic type conversion.

#### **[ConvertMongooseFilter](validate-mongoose-filter.md)** | **[📄 Code](../../src/utils/decorators/database/mongo/validate-mongoose-filter.decorator.ts)**
**MongoDB query builder automation (Use Case layer).** Automatic MongoDB filter generation with regex optimization, type conversion, and $or/$and structure for complex queries.

#### **[ConvertMongoFilterToBaseRepository](convert-mongoose-filter.md)** | **[📄 Code](../../src/utils/decorators/database/mongo/convert-mongoose-filter.decorator.ts)**
**MongoDB filter normalization (Repository layer).** Flattens nested filter objects, handles id→_id conversion, and prepares queries for base repository operations.


---

## 🎯 **Decorator Categories**

### **Application Layer**
- **ValidateSchema** - Input validation and sanitization
- **Permission** - Authorization and access control
- **RequestTimeout** - Request lifecycle management
- **LogExecutionTime** - Performance monitoring

### **Infrastructure Layer** 
- **CircuitBreaker** - External service reliability
- **RunInNewThread** - CPU-intensive task isolation
- **RunInNewProcess** - Memory-intensive task isolation

### **Data Access Layer**
- **ValidateDatabaseSortAllowed** - Sort validation and mapping
- **ConvertTypeOrmFilter** - PostgreSQL query automation
- **ConvertMongooseFilter** - MongoDB query automation  
- **ConvertMongoFilterToBaseRepository** - Base repository enhancement

---

## 🔥 **Impact Summary**

| **Problem Solved** | **Lines Saved** | **Decorators** |
|---------------------|------------------|----------------|
| Manual validation hell | 50+ lines → 1 line | ValidateSchema, Permission |
| TypeORM query construction | 100+ lines → 2 lines | ConvertTypeOrmFilter, ValidateDatabaseSortAllowed |
| MongoDB filter building | 70+ lines → 2 lines | ConvertMongooseFilter |
| Worker/Process management | 150+ lines → 1 line | RunInNewThread, RunInNewProcess |
| Circuit breaker setup | 80+ lines → 1 line | CircuitBreaker |
| Performance monitoring | 20+ lines → 1 line | LogExecutionTime |

**Total Impact: ~470+ lines of boilerplate → 8 decorators** 🚀

---

## 📖 **How to Read These Docs**

Each decorator documentation follows a consistent structure:

1. **The Problem** - Manual implementation showing complexity
2. **The Solution** - Elegant decorator approach  
3. **Features** - Advanced capabilities and options
4. **Real Examples** - Production-ready use cases
5. **Performance** - Benchmarks and optimizations
6. **Why Essential** - Impact and benefits summary

---

## 🎨 **Design Principles**

These decorators follow key design principles:

- **🎯 Single Responsibility** - Each decorator solves one specific problem
- **🔒 Type Safety** - Full TypeScript support with compile-time validation  
- **⚡ Performance** - Zero overhead abstractions with optimal implementations
- **🛡️ Security** - Built-in protection against common vulnerabilities
- **📦 Composability** - Decorators work together seamlessly
- **🔧 Developer Experience** - Intuitive APIs with comprehensive error messages

---

**These decorators represent the evolution from manual, error-prone implementations to elegant, automated, production-ready solutions that make complex operations simple and reliable.** ✨