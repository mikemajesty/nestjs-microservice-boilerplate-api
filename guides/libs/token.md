# Token Service

Centralized JWT token management service for user authentication. This library encapsulates all token-related logic including **signing**, **verification**, and **expiration handling**.

## Overview

The Token Service provides a clean abstraction over JWT operations, ensuring consistent token handling across the entire application. It follows the **Adapter Pattern** for easy testing and dependency injection.

## Authentication Flow

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌─────────────┐
│   Client    │────▶│    Login     │────▶│ TokenService │────▶│   Client    │
│  (Request)  │     │  Controller  │     │   .sign()    │     │  (JWT Token)│
└─────────────┘     └──────────────┘     └──────────────┘     └─────────────┘
      │                                                              │
      │                    ┌──────────────┐                          │
      │                    │ TokenService │                          │
      └───────────────────▶│  .verify()   │◀─────────────────────────┘
                           └──────────────┘
                                  │
                           ┌──────▼──────┐
                           │  Protected  │
                           │  Resources  │
                           └─────────────┘
```

### Token Lifecycle

1. **User Login** → Credentials validated → `TokenService.sign()` generates JWT
2. **Client Request** → JWT sent in Authorization header
3. **Guard Verification** → `TokenService.verify()` validates token
4. **Token Expiration** → After `TOKEN_EXPIRATION` (default: `1h`), token becomes invalid
5. **User Logout** → Token added to blacklist in Redis

## API Reference

### `sign<TOpt>(model: SignInput, options?: TOpt): SignOutput`

Generates a signed JWT token with user payload.

```typescript
const { token } = this.tokenService.sign({
  email: user.email,
  roles: user.roles,
  password: user.password // hashed
})
```

**Parameters:**
- `model` - User data to encode in token (email, roles, password hash)
- `options` - Optional JWT sign options (overrides default expiration)

**Returns:**
- `{ token: string }` - Signed JWT token

### `verify<T>(token: string): Promise<T>`

Verifies and decodes a JWT token.

```typescript
const decoded = await this.tokenService.verify<UserPayload>(token)
// { email: 'user@example.com', roles: [...], iat: ..., exp: ... }
```

**Parameters:**
- `token` - JWT token string to verify

**Returns:**
- Decoded token payload

**Throws:**
- `ApiUnauthorizedException` - If token is invalid or expired

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TOKEN_EXPIRATION` | `1h` | JWT token lifetime |
| `REFRESH_TOKEN_EXPIRATION` | `1d` | Refresh token lifetime |
| `JWT_SECRET_KEY` | - | Secret key for signing tokens |

### Token Payload Schema

```typescript
const TokenGetSchema = UserEntitySchema.pick({
  email: true,
  roles: true
}).and(InputValidator.object({ 
  password: InputValidator.string() 
}))
```

The token payload includes:
- `email` - User's email address
- `roles` - User's assigned roles (for permission checking)
- `password` - Hashed password (for validation)
- `iat` - Issued at timestamp (auto-added by JWT)
- `exp` - Expiration timestamp (auto-added by JWT)

## Usage Across the Application

### Login Module

```typescript
// src/modules/login/controller.ts
@Controller()
export class LoginController {
  constructor(private readonly tokenService: ITokenAdapter) {}

  @Post('/login')
  async login(@Body() input: LoginInput): Promise<LoginOutput> {
    // ... validate credentials
    const { token } = this.tokenService.sign({
      email: user.email,
      roles: user.roles,
      password: user.password
    })
    return { token }
  }
}
```

### Reset Password Module

```typescript
// src/core/reset-password/use-cases/reset-password-send-email.ts
export class ResetPasswordSendEmailUsecase {
  constructor(private readonly token: ITokenAdapter) {}

  async execute(input: ResetPasswordInput): Promise<void> {
    // Generate short-lived token for password reset
    const { token } = this.token.sign(
      { email: input.email },
      { expiresIn: '15m' } // Custom expiration
    )
    // Send email with reset link containing token
  }
}
```

### Auth Guard (Token Verification)

```typescript
// Token is verified in guards for protected routes
const decoded = await this.tokenService.verify<UserPayload>(token)
// If valid, request proceeds with user context
// If invalid/expired, throws ApiUnauthorizedException
```

## Module Integration

Import `TokenLibModule` in any module that needs token operations:

```typescript
import { TokenLibModule, ITokenAdapter } from '@/libs/token'

@Module({
  imports: [TokenLibModule],
  providers: [
    {
      provide: MyUsecase,
      useFactory: (token: ITokenAdapter) => new MyUsecase(token),
      inject: [ITokenAdapter]
    }
  ]
})
export class MyModule {}
```

## Security Considerations

### Token Blacklisting (Logout)

When a user logs out, the token is stored in Redis until it naturally expires:

```typescript
// src/core/user/use-cases/user-logout.ts
await this.redis.set(token, token, { PX: this.secrets.TOKEN_EXPIRATION })
```

This prevents reuse of valid tokens after logout.

### Best Practices

- ✅ Keep `TOKEN_EXPIRATION` short (1h default) for security
- ✅ Use `REFRESH_TOKEN_EXPIRATION` for longer sessions
- ✅ Store `JWT_SECRET_KEY` securely (never commit to repo)
- ✅ Always verify tokens in guards before accessing protected resources
- ✅ Use custom expiration for specific flows (password reset: 15m)

## Testing

The adapter pattern allows easy mocking in tests:

```typescript
const mockTokenService: ITokenAdapter = {
  sign: jest.fn().mockReturnValue({ token: 'mock-jwt-token' }),
  verify: jest.fn().mockResolvedValue({ email: 'test@example.com', roles: [] })
}
```

## Summary

| Feature | Description |
|---------|-------------|
| **Centralized** | Single source of truth for token operations |
| **Type-Safe** | Full TypeScript support with Zod validation |
| **Configurable** | Environment-based expiration settings |
| **Secure** | Blacklist support, short expiration, proper error handling |
| **Testable** | Adapter pattern enables easy mocking |

**Token Service** - *Secure, centralized JWT management for authentication.*
