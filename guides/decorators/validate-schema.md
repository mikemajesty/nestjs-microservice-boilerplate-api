# ValidateSchema Decorator

**MANDATORY** decorator for all use cases that enforces input validation using Zod schemas. This decorator ensures **type safety, data integrity, and consistent error handling** across the entire application by validating multiple parameters simultaneously.

## Why ValidateSchema is Mandatory

### **Enforces Standard Compliance**

Without ValidateSchema, developers might skip validation or implement inconsistent patterns:

```typescript
// ❌ BAD: No validation, runtime errors possible
class CreateUserUseCase {
  async execute(userData: unknown) {
    // userData could be anything - no safety
    return this.userRepository.create(userData)
  }
}

// ❌ BAD: Manual validation, inconsistent error handling  
class CreateUserUseCase {
  async execute(userData: unknown) {
    if (!userData || typeof userData !== 'object') {
      throw new Error('Invalid data') // Inconsistent error format
    }
    // Manual checks for each field...
  }
}
```

### **Consistent Zod-Based Validation**

ValidateSchema enforces the standard and provides consistent error handling:

```typescript
// ✅ GOOD: Mandatory ValidateSchema with Zod
class CreateUserUseCase {
  @ValidateSchema(CreateUserSchema)
  async execute(userData: CreateUserInput) {
    // userData is guaranteed to be valid and type-safe
    return this.userRepository.create(userData)
  }
}
```

## Multi-Parameter Validation

ValidateSchema can validate **multiple parameters simultaneously**, making it perfect for complex use cases:

```typescript
import { ValidateSchema } from '@/utils/decorators'
import { CreateUserSchema, CreateUserPermissionsSchema } from './schemas'

class CreateUserWithPermissionsUseCase {
  @ValidateSchema(CreateUserSchema, CreateUserPermissionsSchema)
  async execute(
    userData: CreateUserInput, 
    permissionsData: CreateUserPermissionsInput
  ) {
    // Both parameters are validated before execution
    const user = await this.userRepository.create(userData)
    await this.permissionService.assignPermissions(user.id, permissionsData)
    
    return user
  }
}
```

### **Schema Definitions**

```typescript
// CreateUserSchema
export const CreateUserSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  age: z.number().min(18).max(120),
  profile: z.object({
    bio: z.string().optional(),
    preferences: z.object({
      theme: z.enum(['light', 'dark']),
      language: z.string().default('en')
    })
  })
})

// CreateUserPermissionsSchema  
export const CreateUserPermissionsSchema = z.object({
  roles: z.array(z.string()).min(1),
  permissions: z.array(z.string()),
  expiresAt: z.date().optional()
})
```

## Error Handling

ValidateSchema **accumulates errors from all schemas** and returns them together:

```typescript
// If both schemas have validation errors:
const result = await createUserUseCase.execute(
  { 
    name: "A", // Too short
    email: "invalid-email", // Invalid format  
    age: 15 // Too young
  },
  {
    roles: [], // Empty array not allowed
    permissions: ["invalid:format"] // Invalid permission format
  }
)

// Returns combined validation errors:
{
  "issues": [
    {
      "code": "too_small",
      "minimum": 2,
      "path": ["name"],
      "message": "String must contain at least 2 character(s)"
    },
    {
      "code": "invalid_string", 
      "path": ["email"],
      "message": "Invalid email"
    },
    {
      "code": "too_small",
      "minimum": 18,
      "path": ["age"], 
      "message": "Number must be greater than or equal to 18"
    },
    {
      "code": "too_small",
      "minimum": 1,
      "path": ["roles"],
      "message": "Array must contain at least 1 element(s)"
    }
  ]
}
```

## Real-World Use Case Example

```typescript
class UpdateUserProfileUseCase {
  @ValidateSchema(UserIdSchema, UpdateProfileSchema, UpdateSettingsSchema)
  async execute(
    userId: string,
    profileData: UpdateProfileInput,
    settingsData: UpdateSettingsInput
  ) {
    // All three parameters validated simultaneously
    
    // 1. Validate user exists
    const existingUser = await this.userRepository.findById(userId)
    if (!existingUser) {
      throw new ApiNotFoundException('User not found')
    }
    
    // 2. Update profile with validated data
    const updatedProfile = await this.userRepository.updateProfile(
      userId, 
      profileData
    )
    
    // 3. Update settings with validated data
    await this.settingsRepository.updateUserSettings(
      userId,
      settingsData
    )
    
    return updatedProfile
  }
}
```

## Implementation Benefits

### **🔒 Type Safety**
- Parameters are automatically typed after validation
- No manual type guards needed
- Compile-time safety guaranteed

### **🚫 Prevents Invalid Data**  
- Invalid data never reaches business logic
- Consistent validation across all use cases
- Automatic data sanitization and transformation

### **📊 Consistent Error Format**
- Unified error structure across application
- Detailed validation messages with field paths
- Easy frontend error handling integration

### **⚡ Performance Optimized**
- Validation happens before expensive operations
- Early exit on invalid data
- Zod's optimized parsing engine

## Mandatory Usage Pattern

**EVERY use case MUST use ValidateSchema:**

```typescript
// ✅ REQUIRED PATTERN
export class SomeUseCase {
  @ValidateSchema(SomeSchema)
  async execute(input: SomeInput) {
    // Implementation
  }
}

// ❌ FORBIDDEN PATTERN  
export class SomeUseCase {
  async execute(input: any) { // No validation!
    // Implementation
  }
}
```

ValidateSchema is the **foundation of data integrity** in our use cases, ensuring that every operation receives clean, validated, type-safe data while maintaining consistent error handling across the entire application.