# Exception Handler Interceptor

Interceptor that catches **all errors** in the request pipeline. Its job is to **sanitize errors** and **finalize tracing** before passing to the Exception Filter.

## What It Does

1. **Catches** any error from the request pipeline
2. **Sanitizes** external API errors (Axios)
3. **Adds context** (class/method where error occurred)
4. **Finalizes tracing** with error status
5. **Re-throws** to Exception Filter

## Tracing Lifecycle

| Step | Where | Tracing Action |
|------|-------|----------------|
| 1 | Request arrives | `tracing.start()` |
| 2 | Processing... | `tracing.addAttribute()` |
| 3 | **Error occurs** | Interceptor catches |
| 4 | **This interceptor** | `tracing.setStatus(ERROR)` |
| 5 | **This interceptor** | `tracing.finish()` ✓ |
| 6 | Exception Filter | Formats response |

## Error Sanitization

Axios errors are sanitized to expose a consistent interface:

```typescript
// Before: Raw Axios error with nested response
error.response.data.error.message

// After: Sanitized with getResponse() and getStatus()
error.getResponse()  // Returns error data
error.getStatus()    // Returns status code
```

## Status Code Resolution

```typescript
// Priority order for status code:
1. error.response.data.error.code (nested)
2. error.response.data.code
3. error.response.status
4. error.status
5. 500 (fallback)
```

## Summary

| Feature | Description |
|---------|-------------|
| **Purpose** | Catch errors, finalize tracing |
| **Sanitizes** | Axios external API errors |
| **Adds** | traceid, context |
| **Finalizes** | Tracing span with ERROR status |

**Exception Handler Interceptor** - *Error pipeline that closes tracing spans.*
