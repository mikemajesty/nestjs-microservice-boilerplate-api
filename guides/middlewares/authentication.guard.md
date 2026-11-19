# Authentication Guard

Guard that verifies if a request is **authenticated** — i.e., if it carries a valid Bearer token whose login session is still active (not logged out). This is the **first guard** in the chain: it runs **before** the Authorization Guard.

## The Problem

```
❌ Without Authentication:
- Any request hits the route, authenticated or not
- No way to know who the user is
- No way to block logged-out tokens

✅ With Authentication Guard:
- Every protected route requires a valid Bearer token
- Decoded user is attached to `request.user`
- Tokens of ended sessions (logout, password change/reset) are rejected via Redis
```

## How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│  1. Skip if route is marked with @Public()                      │
│  2. Read Authorization header                                   │
│  3. Validate scheme is "Bearer" and token is present            │
│  4. Verify token (JWT) → attach user to request.user            │
│  5. Check the token's session is still active in Redis          │
│  6. Allow or deny request                                       │
└─────────────────────────────────────────────────────────────────┘
```

## Guard Flow

```
Request
   │
   ▼
┌──────────────────────────┐
│ Is @Public()?            │──── Yes ───▶ ✅ Allow
└──────────────────────────┘
   │ No
   ▼
┌──────────────────────────┐
│ Has Authorization header?│──── No ────▶ ❌ 401 no token provided
└──────────────────────────┘
   │ Yes
   ▼
┌──────────────────────────┐
│ Bearer + token present?  │──── No ────▶ ❌ 401 malformed authorization header
└──────────────────────────┘
   │ Yes
   ▼
┌──────────────────────────┐
│ Token verifies (JWT)?    │──── No ────▶ ❌ 401 invalidToken
└──────────────────────────┘
   │ Yes
   ▼
┌──────────────────────────┐
│ Session ended?           │──── Yes ───▶ ❌ 401 you have been logged out
└──────────────────────────┘
   │ No
   ▼
✅ Allow Request
```

## Usage

### Public Endpoints

Mark a route as public to skip authentication:

```typescript
import { Public } from '@/utils/decorators'

@Controller('health')
export class HealthController {
  @Get()
  @Public()
  check() {
    return { status: 'ok' }
  }
}
```

### Protected Endpoints (default)

Any route **without** `@Public()` requires a valid Bearer token:

```typescript
@Controller('users')
export class UserController {
  @Get('me')
  me(@Req() { user }: ApiRequest) {
    return user // request.user is set by the guard
  }
}
```

## Active Session (Logout)

Every access token carries the id of its login session (`sid`). After verifying the JWT, the guard
checks that the session still exists in Redis:

```typescript
const active = await this.session.isActive(request.user.id, request.user.sid)
if (!active) {
  throw new ApiUnauthorizedException('you have been logged out')
}
```

Logout, password change and password reset end sessions, so their tokens are rejected right away.
Tokens without `sid` (for example password-reset tokens) are rejected as `invalidToken`.
See [Session](../libs/session.md).

## Error Responses

**401 Unauthorized** - No token:

```json
{
  "error": {
    "code": 401,
    "message": ["no token provided"]
  }
}
```

**401 Unauthorized** - Malformed header:

```json
{
  "error": {
    "code": 401,
    "message": ["malformed authorization header"]
  }
}
```

**401 Unauthorized** - Invalid token:

```json
{
  "error": {
    "code": 401,
    "message": ["invalidToken"]
  }
}
```

**401 Unauthorized** - Logged out:

```json
{
  "error": {
    "code": 401,
    "message": ["you have been logged out"]
  }
}
```

## Summary

| Feature       | Description                                      |
| ------------- | ------------------------------------------------ |
| **Decorator** | `@Public()` to skip                              |
| **Header**    | `Authorization: Bearer <token>`                  |
| **Verify**    | JWT via `ITokenAdapter`                          |
| **Session**   | Redis key `auth:session:<userId>:<sid>`          |
| **401**       | Missing, malformed, invalid token or ended session |
| **Runs**      | Before `AuthorizationGuard`                      |

**Authentication Guard** - _Ensures the request is authenticated._
