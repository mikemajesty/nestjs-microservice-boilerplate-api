# Authorization Guard

Guard that verifies if a request has **permission to access** a protected endpoint. Uses a **Role-Based Access Control (RBAC)** system with roles and permissions.

## The Problem

```
❌ Without Authorization:
- Any authenticated user can access any endpoint
- No fine-grained access control
- Can't restrict admin-only features

✅ With Authorization Guard:
- Permission-based access control
- Users have roles, roles have permissions
- Flexible and scalable authorization
```

## RBAC Model

```
┌─────────────────────────────────────────────────────────────────┐
│                     RBAC HIERARCHY                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   User ───────▶ Roles ───────▶ Permissions                      │
│                                                                  │
│   ┌────────┐    ┌─────────┐    ┌──────────────────┐            │
│   │  John  │───▶│  Admin  │───▶│ user:create      │            │
│   └────────┘    └─────────┘    │ user:delete      │            │
│                     │          │ role:update      │            │
│                     │          └──────────────────┘            │
│                     ▼                                           │
│                ┌─────────┐    ┌──────────────────┐             │
│                │  User   │───▶│ user:read        │             │
│                └─────────┘    │ user:update      │             │
│                               └──────────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

## How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│  1. Check if endpoint requires permission (@Permission)         │
│  2. Extract user ID from JWT (request.user.id)                  │
│  3. Fetch user with roles from database                         │
│  4. Collect all permissions from user's roles                   │
│  5. Check if required permission exists                         │
│  6. Allow or deny request                                       │
└─────────────────────────────────────────────────────────────────┘
```

## Usage

### Protecting an Endpoint

```typescript
import { Permission } from '@/utils/decorators'

@Controller('users')
export class UserController {
  @Post()
  @Permission('user:create')  // Only users with this permission
  async createUser(@Body() input: CreateUserInput) {
    return this.userService.create(input)
  }

  @Delete(':id')
  @Permission('user:delete')  // Admin-only operation
  async deleteUser(@Param('id') id: string) {
    return this.userService.delete(id)
  }
}
```

### Permission Format

Permissions follow the pattern `resource:action`:

| Permission | Description |
|------------|-------------|
| `user:create` | Create users |
| `user:read` | Read users |
| `user:update` | Update users |
| `user:delete` | Delete users |
| `role:create` | Create roles |
| `role:update` | Update roles |

### No Permission = Public

If no `@Permission()` decorator is present, the endpoint is accessible to any authenticated user:

```typescript
@Get('profile')
// No @Permission - any authenticated user can access
async getProfile() {
  return this.userService.getProfile()
}
```

## Guard Flow

```
Request
   │
   ▼
┌──────────────────────────┐
│ Has @Permission?         │──── No ────▶ ✅ Allow
└──────────────────────────┘
   │ Yes
   ▼
┌──────────────────────────┐
│ Has valid user token?    │──── No ────▶ ❌ 401 Unauthorized
└──────────────────────────┘
   │ Yes
   ▼
┌──────────────────────────┐
│ User exists in DB?       │──── No ────▶ ❌ 401 Unauthorized
└──────────────────────────┘
   │ Yes
   ▼
┌──────────────────────────┐
│ User has permission?     │──── No ────▶ ❌ 403 Forbidden
└──────────────────────────┘
   │ Yes
   ▼
✅ Allow Request
```

## Error Responses

**401 Unauthorized** - No valid token:
```json
{
  "error": {
    "code": 401,
    "message": ["invalidToken"]
  }
}
```

**403 Forbidden** - No permission:
```json
{
  "error": {
    "code": 403,
    "message": ["You Shall Not Pass"],
    "context": "UserController/deleteUser",
    "parameters": { "permission": "user:delete" }
  }
}
```

## Summary

| Feature | Description |
|---------|-------------|
| **Model** | Role-Based Access Control (RBAC) |
| **Decorator** | `@Permission('resource:action')` |
| **Check** | User → Roles → Permissions |
| **401** | Invalid or missing token |
| **403** | Valid token, no permission |

**Authorization Guard** - *Fine-grained access control with RBAC.*
