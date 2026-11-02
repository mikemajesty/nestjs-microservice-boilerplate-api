# Permission Decorator

Critical authorization decorator that **enforces granular access control** on route endpoints. This decorator ensures only users with specific permissions can access protected resources, implementing a **robust permission-based security system**.

## The Authorization Problem

Without proper permission control, applications face serious security vulnerabilities:

```typescript
// ❌ DANGEROUS: No permission control
@Post('cats')
async createCat(@Req() { body }: ApiRequest) {
  // ANY authenticated user can create cats
  return this.catService.create(body)
}

// ❌ RISKY: Role-only authorization (too broad)
@Roles('admin', 'user') 
@Post('cats')
async createCat(@Req() { body }: ApiRequest) {
  // All users can create cats - no granular control
  return this.catService.create(body)
}
```

## Permission-Based Security

The `@Permission` decorator provides **fine-grained access control** with standardized permission naming:

```typescript
// ✅ SECURE: Granular permission control
@Post('cats')
@Permission('cat:create')
async createCat(@Req() { body }: ApiRequest) {
  // Only users with 'cat:create' permission can access
  return this.catService.create(body)
}
```

## Permission Format Requirements

### **Mandatory Colon Format**

All permissions MUST follow the `resource:action` pattern:

```typescript
// ✅ CORRECT FORMAT
@Permission('cat:create')     // Resource: cat, Action: create
@Permission('user:update')    // Resource: user, Action: update
@Permission('role:delete')    // Resource: role, Action: delete

// ❌ INVALID FORMAT - Will throw ApiInternalServerException
@Permission('createcat')      // Missing colon
@Permission('cat-create')     // Wrong separator
@Permission('CAT:CREATE')     // Will be auto-lowercased to 'cat:create'
```

### **Auto-Sanitization**

The decorator automatically converts permissions to lowercase:

```typescript
@Permission('CAT:CREATE')     // Becomes 'cat:create'
@Permission('User:Update')    // Becomes 'user:update'
@Permission('ROLE:DELETE')    // Becomes 'role:delete'
```

## Real Permission System

### **Database Structure**

From migrations, the system defines these permissions:

```typescript
// User permissions
const userPermissions = [
  'cat:create',
  'cat:update', 
  'cat:getbyid',
  'cat:list',
  'cat:delete',
  'user:logout',
  'user:create',
  'user:update',
  'user:list',
  'user:getbyid',
  'user:changepassword',
  'user:delete'
]

// Backoffice permissions  
const backofficePermissions = [
  'permission:create',
  'permission:update',
  'permission:getbyid',
  'permission:list', 
  'permission:delete',
  'role:create',
  'role:update',
  'role:getbyid',
  'role:list',
  'role:delete',
  'role:addpermission',
  'role:deletepermission'
]
```

### **Controller Implementation**

```typescript
@Controller('cats')
export class CatController {
  @Post()
  @Permission('cat:create')
  async create(@Req() { body }: ApiRequest) {
    return this.catService.create(body)
  }

  @Get(':id')
  @Permission('cat:getbyid')
  async getById(@Param('id') id: string) {
    return this.catService.getById(id)
  }

  @Get()
  @Permission('cat:list')
  async list(@Query() query: ListCatsDto) {
    return this.catService.list(query)
  }

  @Put(':id')
  @Permission('cat:update')
  async update(@Param('id') id: string, @Req() { body }: ApiRequest) {
    return this.catService.update(id, body)
  }

  @Delete(':id')
  @Permission('cat:delete')
  async delete(@Param('id') id: string) {
    return this.catService.delete(id)
  }
}
```

## Prerequisites for Functionality

### **1. Permission Guard Implementation**

The decorator requires a **PermissionGuard** that:
- Extracts user permissions from JWT/session
- Compares required permission with user permissions
- Allows/denies access based on permission match

### **2. Database Schema Setup**

Required tables from migrations:
- **permissions** table with predefined permissions
- **roles** table defining available roles  
- **users_roles** junction table for user-role mapping
- **permissions_roles** junction table for role-permission mapping

The permission system works through roles: **User → Role → Permission**

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    User     │───▶│    Role     │───▶│ Permission  │
│             │    │             │    │             │
│ mike.lima   │    │ admin       │    │ cat:create  │
│ john.doe    │    │ user        │    │ cat:update  │
│ jane.smith  │    │ editor      │    │ user:list   │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       │                   │                   │
  users_roles       permissions_roles      permissions
  (ManyToMany)       (ManyToMany)            table
```

**TypeORM Relationships:**
- `UserSchema.roles` → `@ManyToMany(() => RoleSchema)` via `users_roles` table
- `RoleSchema.permissions` → `@ManyToMany(() => PermissionSchema)` via `permissions_roles` table  
- Both relationships use `eager: true` for automatic loading

**Authorization Flow:**
1. Request arrives with `@Permission('cat:create')`
2. Extract user from JWT token
3. Get user's roles via `users_roles` junction (eager loaded)
4. Get role permissions via `permissions_roles` junction (eager loaded)
5. Check if any role has required permission
6. Allow/deny access based on permission match

### **3. Authentication Prerequisites**

User must be authenticated with:
- Valid JWT token containing user ID
- User roles loaded and available in request context
- Role-to-permission resolution to determine user permissions

## Security Benefits

### **🔒 Granular Access Control**
- **Resource-specific permissions** instead of broad roles
- **Action-level security** (create vs read vs delete)
- **Principle of least privilege** enforcement

### **🛡️ Standardized Permission Format**
- **Consistent naming convention** across entire application
- **Auto-validation** prevents malformed permissions
- **Case-insensitive** handling reduces errors

### **⚡ Performance Optimized**
- **Metadata-based** implementation using NestJS SetMetadata
- **Guard-level checking** prevents unnecessary route execution
- **Cached permission resolution** for authenticated users

### **🔧 Maintainable Security**
- **Centralized permission definitions** in migrations
- **Clear permission hierarchy** with resource:action pattern
- **Easy permission auditing** and management

The Permission decorator is the **cornerstone of application security**, ensuring that every protected endpoint validates user permissions before executing business logic, implementing defense-in-depth with granular, standardized access control.