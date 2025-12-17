# AuthenticationMiddleware

NestJS Middleware that **validates JWT tokens** before any route handler executes. Runs earliest in the request lifecycle, ensuring only authenticated requests proceed.

## Validation Flow

```
Request → Has token? → Token in blacklist? → Token valid? → Inject user → Next
              │               │                    │
              ↓               ↓                    ↓
         401 Error       401 Error            401 Error
      "no token"     "logged out"         "invalidToken"
```

## Responsibilities

| Step | Check | On Failure |
|------|-------|------------|
| 1 | `Authorization` header exists | 401 - "no token provided" |
| 2 | Token not in Redis blacklist | 401 - "you have been logged out" |
| 3 | JWT signature valid & not expired | 401 - "invalidToken" |

## Request Enrichment

On success, the middleware injects:

```typescript
request.user = {
  id: string
  email: string
  name: string
}

request.id = traceid // From header or generated UUID
```

## Internal Methods

| Method | Purpose |
|--------|---------|
| `use()` | Main middleware logic - validates token and injects user |
| `finishTracing()` | Ends OpenTelemetry span on auth failure with error status |

## Token Blacklist (Logout)

When a user logs out, their token is added to Redis. This middleware checks the blacklist to prevent reuse of "logged out" tokens:

```typescript
const expiredToken = await this.redisService.get(token)
if (expiredToken) {
  throw new ApiUnauthorizedException('you have been logged out')
}
```

## Related

- [Authorization Guard](./authorization.guard.md) — Permission checking (runs after authentication)
- [Token Lib](../libs/token.md) — JWT sign/verify implementation
