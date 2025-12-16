# Types

Advanced TypeScript utility types for handling complex type transformations, particularly useful with Zod schema validation and configuration management.

## Available Types

### ZodInferSchema<T>

Complex utility type for creating Zod schema types from TypeScript interfaces, automatically handling optional and required fields.

#### Usage Context

Used primarily in **configuration modules** where you need to create Zod schemas that match interface structures:

```typescript
// Example: Secrets configuration
interface ISecretsAdapter {
  ENV: string
  TIMEOUT: number  
  HOST: string
  IS_LOCAL?: boolean  // Optional field
  IS_PRODUCTION: boolean
}

// Create Zod schema that matches the interface
const SecretsSchema = InputValidator.object<ZodInferSchema<ISecretsAdapter>>({
  ENV: InputValidator.enum(EnvEnum),
  TIMEOUT: InputValidator.number().or(InputValidator.string()).transform(p => Number(p)),
  HOST: InputValidator.string(),
  IS_LOCAL: InputValidator.boolean(),  // Automatically handles optionality
  IS_PRODUCTION: InputValidator.boolean()
})
```

#### Benefits
- **Type Safety**: Ensures Zod schema matches interface structure
- **Automatic Optionality**: Correctly handles optional vs required fields
- **Refactoring Safe**: Changes to interface automatically reflect in schema type checking

### MakePartial<T>

Recursively makes all properties of an object and nested objects optional.

#### Potential Usage

This type **might not be actively used** in your current application. Consider these scenarios:

```typescript
// API updates where all fields are optional
interface User {
  name: string
  email: string  
  profile: {
    bio: string
    age: number
  }
}

type UserUpdate = MakePartial<User>
// Result: { name?: string, email?: string, profile?: { bio?: string, age?: number } }
```

**Recommendation**: If you're not using `MakePartial` anywhere in your codebase, you can safely delete it. The built-in TypeScript `Partial<T>` might be sufficient for most use cases, though it doesn't work recursively.

## Internal Implementation Details

### Helper Types (Private)

The file contains internal helper types that support the public APIs:

- `Equals<X, Y>`: Type-level equality checking
- `NonUndefined<T>`: Removes undefined from union types

These are implementation details and should not be used directly in application code.

## Usage Recommendations

### Keep ZodInferSchema
This type is **actively used** in your secrets module and provides real value for type-safe configuration validation.

### Review MakePartial
This type appears **unused** in your current codebase. Consider:
- Searching for actual usage patterns
- Removing if unused to reduce complexity
- Replacing with built-in `Partial<T>` if shallow partial types are sufficient

## Migration Notes

If removing unused types:

```typescript
// Safe to remove if unused:
export type MakePartial<T> = {
  [P in keyof T]: T[P] extends object ? MakePartial<T[P]> : T[P]
}

// Keep this - actively used:
export type ZodInferSchema<T extends object> = { /* ... */ }
```