# Exception Handler Filter

Global exception filter that **standardizes and sanitizes** all API error responses. Every error that occurs in the application passes through this filter, ensuring consistent and secure error output.

## The Problem

```
❌ Without Exception Handler:
- Inconsistent error formats across endpoints
- Sensitive information leaking in errors
- Stack traces exposed to clients
- Different error structures from different sources (Zod, Axios, etc.)

✅ With Exception Handler:
- Unified error response format
- Sensitive errors hidden with generic messages
- All error types normalized
- Traceability with traceid
```

## Error Response Structure

Every error follows this robust structure:

```typescript
{
  error: {
    code: 500,                              // HTTP status code
    traceid: "abc-123-def",                 // Request tracking ID
    context: "UserService",                 // Where error occurred
    name: "ApiNotFoundException",           // Exception class name
    message: ["User not found"],            // Error messages array
    details: [...],                         // Optional additional details
    timestamp: "2025-01-15 10:30:00",       // When error occurred
    path: "/api/users/123"                  // Request path
  }
}
```

### Example Responses

**404 - Not Found:**
```json
{
  "error": {
    "code": 404,
    "traceid": "req-abc-123",
    "context": "UserService",
    "name": "ApiNotFoundException",
    "message": ["User with ID 123 not found"],
    "timestamp": "2025-01-15 10:30:00",
    "path": "/api/users/123"
  }
}
```

**400 - Validation Error (Zod):**
```json
{
  "error": {
    "code": 400,
    "traceid": "req-def-456",
    "context": "CreateUserUseCase",
    "name": "ZodError",
    "message": [
      "email: Invalid email",
      "password: String must contain at least 8 character(s)"
    ],
    "timestamp": "2025-01-15 10:30:00",
    "path": "/api/users"
  }
}
```

## Error Sanitization with DefaultErrorMessage

Some errors should **never expose internal details** to clients. The `DefaultErrorMessage` map replaces sensitive error messages with generic ones:

```typescript
// src/utils/http-status.ts
export const DefaultErrorMessage: { [key: string]: string } = {
  ECONNREFUSED: 'Connection Refused',
  403: 'You Shall Not Pass',
  405: 'Method Not Allowed',
  500: 'Internal Server Error.',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  // ... more
}
```

### How It Works

```
┌────────────────────────────────────────────────────────────────────┐
│  Original Error: "ECONNREFUSED: Cannot connect to DB at 10.0.0.5" │
│                                                                    │
│                              ▼                                     │
│                                                                    │
│  DefaultErrorMessage['ECONNREFUSED'] = 'Connection Refused'       │
│                                                                    │
│                              ▼                                     │
│                                                                    │
│  Client sees: "Connection Refused"  ✅ (no IP leaked)             │
└────────────────────────────────────────────────────────────────────┘
```

### Security Benefits

| Original Error | Sanitized Response |
|----------------|-------------------|
| `ECONNREFUSED 10.0.0.5:5432` | `Connection Refused` |
| `Error: DB password invalid` | `Internal Server Error.` |
| `TypeError: Cannot read...` | `Internal Server Error.` |
| `403: JWT signature invalid` | `You Shall Not Pass` |

## Error Type Handling

The filter intelligently handles different error sources:

### 1. Zod Validation Errors

```typescript
// Input: ZodError with issues
// Output: Formatted validation messages
{
  "message": [
    "email: Invalid email",
    "array position: 0, property: name: Required"
  ]
}
```

### 2. Axios Errors (External APIs)

```typescript
// Extracts message from external API response
// Or returns generic message if none available
{
  "message": ["External API request failed"]
}
```

### 3. Base Exceptions

```typescript
// Your custom exceptions with proper formatting
throw new ApiNotFoundException('User not found', {
  context: 'UserService',
  details: [{ userId: '123' }]
})
```

## Registration

The filter is registered globally in `main.ts`:

```typescript
// src/main.ts
const loggerService = app.get(ILoggerAdapter)
app.useGlobalFilters(new ExceptionHandlerFilter(loggerService))
```

## Summary

| Feature | Description |
|---------|-------------|
| **Standardization** | All errors follow same JSON structure |
| **Sanitization** | Sensitive errors hidden via `DefaultErrorMessage` |
| **Traceability** | Every error includes `traceid` for debugging |
| **Multi-source** | Handles Zod, Axios, HttpException, and custom errors |
| **Logging** | All errors automatically logged |

**Exception Handler Filter** - *Secure, consistent error responses for your API.*
