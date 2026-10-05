# Application Bootstrap

This bootstrap configuration implements **production-grade security** and **operational best practices** following [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices) — the largest compilation of Node.js best practices with 100k+ stars.

## Security Best Practices Implemented

### 🛡️ Helmet Security Headers

```typescript
app.use(
  helmet({
    xssFilter: true,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: [`'self'`],
        styleSrc: [`'self'`],
        frameSrc: ["'none'"],
        upgradeInsecureRequests: [],
        imgSrc: [`'self'`, 'data:', 'blob:', 'validator.swagger.io'],
        scriptSrc: ["'self'", (req, res) => `'nonce-${res.locals.nonce}'`]
      }
    }
  })
)
```

| Header | Purpose | Best Practice Reference |
|--------|---------|------------------------|
| **X-XSS-Protection** | Prevents reflected XSS attacks | [6.6 Secure Headers](https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/security/secureheaders.md) |
| **HSTS** | Forces HTTPS for 1 year, preload-ready | [6.6 Secure Headers](https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/security/secureheaders.md) |
| **Content-Security-Policy** | Prevents XSS, clickjacking, code injection | [6.6 Secure Headers](https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/security/secureheaders.md) |
| **X-Frame-Options** | Prevents clickjacking (frameSrc: 'none') | [6.6 Secure Headers](https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/security/secureheaders.md) |

### 🔐 CSP Nonce Implementation

Dynamic nonce generation prevents inline script injection:

```typescript
app.use(async (req: Request, res: Response, next: NextFunction) => {
  const nonce = CryptoUtils.generateRandomBase64()
  res.locals.nonce = nonce
  res.setHeader('X-Content-Security-Policy-Nonce', nonce)
  next()
})
```

**Why this matters:**
- Each request gets a **unique cryptographic nonce**
- Only scripts with matching nonce can execute
- Blocks malicious injected scripts even if XSS vulnerability exists

---

## Error Handling Best Practices

### 🚨 Global Exception Filter

```typescript
app.useGlobalFilters(new ExceptionHandlerFilter(loggerService))
```

Centralized error handling ensures:
- **No sensitive data leaks** in error responses
- **Consistent error format** across all endpoints
- **Proper logging** of all errors
- References: [2.4 Handle errors centrally](https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/errorhandling/centralizedhandling.md)

### 💥 Uncaught Exception Handlers

```typescript
process.on('uncaughtException', (error) => {
  loggerService.error(error as ErrorType)
})

process.on('unhandledRejection', (error) => {
  loggerService.error(error as ErrorType)
})
```

**Critical for production:**
- **Catches programmer errors** that escape try/catch
- **Logs before crash** for debugging
- **Prevents silent failures**
- References: 
  - [2.6 Exit gracefully](https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/errorhandling/shuttingtheprocess.md)
  - [2.7 Use a mature logger](https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/errorhandling/usematurelogger.md)
  - [2.10 Catch unhandled rejections](https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/errorhandling/catchunhandledpromiserejection.md)

---

## Performance Best Practices

### ⚡ Response Compression

```typescript
app.use(compression())
```

- **Reduces bandwidth** by 70-90% for text responses
- **Faster page loads** for clients
- References: [5.11 Get frontend assets out of Node](https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/production/frontendout.md)

### ⏱️ Timeout Configuration

```typescript
function setTimeout() {
  const httpServer = app.getHttpServer()
  httpServer.timeout = HTTP_REQUEST_TIMEOUT_MS + 1000
  httpServer.keepAliveTimeout = 60000
  httpServer.headersTimeout = 61000
}
```

| Setting | Value | Purpose |
|---------|-------|---------|
| **timeout** | configurable + 1s buffer | Request timeout with grace period |
| **keepAliveTimeout** | 60s | Prevents premature connection close behind ALB/nginx |
| **headersTimeout** | 61s | Must be > keepAliveTimeout (Node.js requirement) |

**Why 61 > 60?**
Node.js requires `headersTimeout > keepAliveTimeout` to prevent race conditions. This is a common **production gotcha** when behind load balancers.

---

## Observability Best Practices

### 📊 Distributed Tracing (OpenTelemetry)

```typescript
import './utils/tracing'  // First import!
```

The tracing module is imported **before anything else** to instrument all modules:

- **Zipkin integration** for distributed tracing
- **Request correlation** across microservices
- **Performance bottleneck identification**
- References: [5.1 Monitoring](https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/production/monitoring.md)

### 📝 Structured Logging

```typescript
const loggerService = app.get(ILoggerAdapter)
loggerService.setApplication(name)
app.useLogger(loggerService)
```

- **Application name in every log** for multi-service filtering
- **Structured JSON format** for log aggregation
- **Log levels** (error, warn, log) for severity filtering
- References: 
  - [2.7 Use a mature logger](https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/errorhandling/usematurelogger.md)
  - [5.2 Smart logging](https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/production/smartlogging.md)
  - [5.14 Assign transaction ID](https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/production/assigntransactionid.md)

---

## API Best Practices

### 🏷️ API Versioning

```typescript
app.enableVersioning({ type: VersioningType.URI })
```

URI-based versioning (`/api/v1/cats`, `/api/v2/cats`):
- **Non-breaking changes** for existing clients
- **Clear deprecation path**
- **Easy to route** at load balancer level

### 🌐 Internationalization (i18n)

```typescript
await initI18n('en-US')

app.use(async (req, res, next) => {
  const locale = normalizeLocale(rawLocale)
  await changeLanguage(locale)
  next()
})
```

Language detection priority:
1. `?lang=pt-BR` query parameter (explicit)
2. `Accept-Language` header (browser preference)
3. `en-US` fallback (default)

---

## Security Checklist Summary

| Practice | Status | Reference |
|----------|--------|-----------|
| ✅ Helmet security headers | Implemented | [Secure Headers](https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/security/secureheaders.md) |
| ✅ HSTS enabled (1 year) | Implemented | [Secure Headers](https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/security/secureheaders.md) |
| ✅ CSP with nonce | Implemented | [Secure Headers](https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/security/secureheaders.md) |
| ✅ XSS filter enabled | Implemented | [Secure Headers](https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/security/secureheaders.md) |
| ✅ Clickjacking protection | Implemented | [Secure Headers](https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/security/secureheaders.md) |
| ✅ Global error handler | Implemented | [Centralized Handling](https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/errorhandling/centralizedhandling.md) |
| ✅ Uncaught exception handler | Implemented | [Shutting Process](https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/errorhandling/shuttingtheprocess.md) |
| ✅ Unhandled rejection handler | Implemented | [Catch Rejections](https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/errorhandling/catchunhandledpromiserejection.md) |
| ✅ Response compression | Implemented | [Frontend Out](https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/production/frontendout.md) |
| ✅ CORS enabled | Implemented | [Secure Headers](https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/security/secureheaders.md) |
| ✅ Distributed tracing | Implemented | [Monitoring](https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/production/monitoring.md) |
| ✅ Structured logging | Implemented | [Mature Logger](https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/errorhandling/usematurelogger.md) |
| ✅ Transaction ID in logs | Implemented | [Transaction ID](https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/production/assigntransactionid.md) |
| ✅ Swagger disabled in production | Implemented | [NODE_ENV](https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/production/setnodeenv.md) |

---

## Production vs Development

```typescript
if (!IS_PRODUCTION) {
  const swaggerDocument = yaml.load(...)
  app.use('/api-docs', swagger.serve, swagger.setup(swaggerDocument))
}
```

**Security principle:** Swagger documentation is **disabled in production** to prevent API structure exposure to attackers.

References: [5.15 Set NODE_ENV=production](https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/production/setnodeenv.md)

---

## Credits

This application's security and operational practices are heavily inspired by:

📚 **[Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)**
> The largest compilation of Node.js best practices (100k+ ⭐)
> By Yoni Goldberg and contributors

The repository provides comprehensive guidance on:
- ✅ [Project structure](https://github.com/goldbergyoni/nodebestpractices#1-project-architecture-practices)
- ✅ [Error handling](https://github.com/goldbergyoni/nodebestpractices#2-error-handling-practices)
- ✅ [Code style](https://github.com/goldbergyoni/nodebestpractices#3-code-patterns-and-style-practices)
- ✅ [Testing](https://github.com/goldbergyoni/nodebestpractices#4-testing-and-overall-quality-practices)
- ✅ [Security](https://github.com/goldbergyoni/nodebestpractices#6-security-best-practices)
- ✅ [Performance](https://github.com/goldbergyoni/nodebestpractices#7-draft-performance-best-practices)
- ✅ [Docker](https://github.com/goldbergyoni/nodebestpractices#8-docker-best-practices)

**Highly recommended reading** for any Node.js/NestJS developer building production applications.

---

## Related Guides

- [Environment Variables](environment.md) - All `.env` configuration options
- [Package Scripts](package.md) - npm scripts reference
- [Docker](docker.md) - Container and infrastructure setup
- [Husky](husky.md) - Git hooks configuration

---

## Related Links

- [Node.js Best Practices Repository](https://github.com/goldbergyoni/nodebestpractices)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [OWASP Security Headers](https://owasp.org/www-project-secure-headers/)
- [NestJS Security](https://docs.nestjs.com/security/helmet)
