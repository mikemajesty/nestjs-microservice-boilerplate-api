# HTTP Status

User-friendly error message mappings that provide clean, professional error messages to frontend applications while preserving technical details in server logs.

## Purpose

This utility is primarily used by the **exception filter** to transform technical HTTP status codes into user-friendly messages that are appropriate for displaying to end users. The system shows friendly messages to users while logging full technical details server-side.

## How It Works

When an error occurs, the system checks if there's a friendly message mapped to the status code:

```typescript
export const DefaultErrorMessage: { [key: string]: string } = {
  ECONNREFUSED: 'Connection Refused',
  403: 'You Shall Not Pass',          // Creative forbidden message
  405: 'Method Not Allowed',
  422: 'Unprocessable Entity',
  429: 'Too Many Requests',
  500: 'Internal Server Error.',
  503: 'Service Unavailable',
  // ... more mappings
}
```

**What Users See vs. What Gets Logged:**
- **Frontend**: Clean, user-friendly message from `DefaultErrorMessage`
- **Server Logs**: Full technical error details, stack traces, and debugging info

## Usage in Exception Filter

The filter automatically uses these mappings:

```typescript
// In exception-handler.filter.ts
private getErrorMessage(exception: BaseException, status: number): string[] {
  const defaultError = DefaultErrorMessage[String(status)]
  if (defaultError) {
    return [defaultError]  // Send friendly message to frontend
  }
  
  // Fallback to technical error handling
  return this.formatTechnicalError(exception)
}
```

## Real-World Examples

### Authentication & Authorization
```typescript
// Status 403 - Instead of technical jargon
// ❌ "Access denied: insufficient role permissions for resource:user:delete"
// ✅ "You Shall Not Pass"  (friendly LOTR reference)

// Status 401 - Could add friendly login prompt
401: "Please log in to continue"
```

### Resource & Validation Errors  
```typescript
// Status 422 - Validation errors
// ❌ "ZodError: Invalid input on field 'email' with constraint 'email'"
// ✅ "Unprocessable Entity"  (or customize to "Please check your input")

// Status 404 - Not found
404: "The requested resource was not found"
```

### Rate Limiting & Performance
```typescript
// Status 429 - Rate limiting
// ❌ "Rate limit exceeded: 100 requests per minute threshold reached"
// ✅ "Too Many Requests"  (or "Please slow down and try again")

// Status 408 - Timeout
// ❌ "Request timeout after 30000ms on upstream service"
// ✅ "Request Timeout"  (or "The request took too long, please try again")
```

### Server & Infrastructure Issues
```typescript
// Status 503 - Service down
// ❌ "Database connection pool exhausted, max connections: 20"
// ✅ "Service Unavailable"  (or "We're currently experiencing technical difficulties")

// Status 502 - External service issues  
// ❌ "Upstream service returned HTTP 500 on payment gateway"
// ✅ "Bad Gateway"  (or "External service temporarily unavailable")
```

## Customization

### Adding New Status Messages
```typescript
export const DefaultErrorMessage: { [key: string]: string } = {
  // Add new custom messages
  400: "Invalid request format",
  404: "Resource not found", 
  409: "This action conflicts with existing data",
  
  // Network-specific errors
  ECONNREFUSED: "Unable to connect to service",
  ETIMEDOUT: "Connection timed out",
  
  // Custom business logic errors
  INSUFFICIENT_BALANCE: "Insufficient account balance",
  EXPIRED_TOKEN: "Your session has expired, please log in again"
}
```

### Removing Status Messages
```typescript
// Simply remove entries you don't want abstracted
export const DefaultErrorMessage: { [key: string]: string } = {
  // Removed 500 - will show technical error instead
  403: 'You Shall Not Pass',
  429: 'Too Many Requests'
}
```

## Benefits

### Better User Experience
- Users see clean, understandable messages instead of technical jargon
- Consistent error messaging across the entire application
- Professional, branded error communication

### Security
- Prevents leaking internal system details to users
- Technical stack traces and sensitive info stay in server logs
- Reduces information disclosure vulnerabilities

### Debugging Support
- Full technical details remain available in server logs
- Developers get complete error context for troubleshooting
- Clean separation between user-facing and debug information

### Maintainability
- Centralized error message management
- Easy to update messages without changing business logic
- Consistent terminology across different error scenarios

## When to Use

- **Add entries**: For error codes your frontend needs to handle gracefully
- **Remove entries**: If you want technical errors to pass through to frontend
- **Customize messages**: To match your application's tone and brand voice