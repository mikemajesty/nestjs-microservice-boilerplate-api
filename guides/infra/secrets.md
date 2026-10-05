# Secrets

Centralized **environment variable management** with **Zod validation** at startup. If any required env is missing or invalid, the application **fails fast** with a clear error message.

## The Problem

Without centralized secrets management:

```typescript
// ❌ SCATTERED ENV ACCESS - Problems everywhere
@Injectable()
export class PaymentService {
  async charge() {
    const apiKey = process.env.PAYMENT_API_KEY  // Typo? Missing? Who knows!
    const timeout = process.env.HTTP_REQUEST_TIMEOUT_MS // String "30000" not number 30000
    const apiUrl = process.env.PAYMENT_URL      // Is it a valid URL? 🤷
    
    // App starts fine, then CRASHES in production when this code runs
  }
}
```

**Common issues:**
- Typos in env names discovered only at runtime
- Missing envs cause crashes in production
- No type safety (everything is `string | undefined`)
- No validation (invalid URLs, wrong formats)
- Envs scattered across the codebase

## The Solution

```typescript
// ✅ CENTRALIZED + VALIDATED - Fails fast at startup
@Injectable()
export class PaymentService {
  constructor(private readonly secrets: ISecretsAdapter) {}
  
  async charge() {
    const apiKey = this.secrets.PAYMENT.API_KEY  // ✅ Type-safe
    const timeout = this.secrets.HTTP_REQUEST_TIMEOUT_MS // ✅ Already a number
    const apiUrl = this.secrets.PAYMENT.URL       // ✅ Validated as URL
    
    // If any env is missing, app FAILS TO START with clear error
  }
}
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           STARTUP FLOW                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  .env file                                                                  │
│      │                                                                      │
│      ▼                                                                      │
│  ┌─────────────────┐                                                        │
│  │  ConfigService  │  (NestJS reads .env)                                   │
│  └────────┬────────┘                                                        │
│           │                                                                 │
│           ▼                                                                 │
│  ┌─────────────────┐                                                        │
│  │ SecretsService  │  (Builds the raw configuration object)                 │
│  └────────┬────────┘                                                        │
│           │                                                                 │
│           ▼                                                                 │
│  ┌─────────────────┐     ┌──────────────────────────────────────────────┐  │
│  │  schema.ts      │ ──▶ │  Zod Validation                              │  │
│  │ SecretsSchema() │     │  • Required fields present?                  │  │
│  └─────────────────┘     │  • Types correct?                            │  │
│                          │  • URLs valid?                               │  │
│                          │  • Enums match allowed values?               │  │
│                          └──────────────────────────────────────────────┘  │
│                                       │                                     │
│                     ┌─────────────────┴─────────────────┐                  │
│                     │                                   │                  │
│                     ▼                                   ▼                  │
│              ✅ All valid                        ❌ Validation failed       │
│              Frozen object injected              App exits with:             │
│                                                                             │
│                                    SecretsService.PAYMENT.API_KEY: Required │
│                                    SecretsService.EMAIL.FROM: Invalid email │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Files Overview

| File | Purpose |
|------|---------|
| `adapter.ts` | Abstract class defining the **interface** (types) |
| `service.ts` | **Builder** - maps env vars into a configuration object |
| `schema.ts` | **Validation schema** - defines conversion and validation rules |
| `module.ts` | **Provider** - builds, validates, freezes, and exposes the configuration |

## Adding a New Environment Variable

Let's add a new `PAYMENT` config with `API_KEY` and `WEBHOOK_URL`:

### Step 1: Define the Type (adapter.ts)

```typescript
// src/infra/secrets/adapter.ts
export abstract class ISecretsAdapter {
  // ... existing properties
  
  PAYMENT!: {
    API_KEY: string
    WEBHOOK_URL: string
  }
}
```

### Step 2: Map the Env Vars (service.ts)

```typescript
// src/infra/secrets/service.ts
export class SecretsService {
  build(): ISecretsAdapter {
    return {
      // ... existing configuration
      PAYMENT: {
        API_KEY: this.get('PAYMENT_API_KEY'),
        WEBHOOK_URL: this.get('PAYMENT_WEBHOOK_URL')
      }
    }
  }
}
```

`build(): ISecretsAdapter` makes the compiler require the new property in the builder. `get()` only helps TypeScript describe the expected shape; it does not convert runtime values.

### Step 3: Add Validation (schema.ts)

```typescript
// src/infra/secrets/schema.ts
export const SecretsSchema = () =>
  InputValidator.object<ZodInferSchema<ISecretsAdapter>>({
  // ... existing validations

  PAYMENT: InputValidator.object({
    API_KEY: InputValidator.string().min(1),
    WEBHOOK_URL: InputValidator.string().url()
  })
})
```

### Step 4: Add to .env

```env
# .env
PAYMENT_API_KEY=sk_live_abc123
PAYMENT_WEBHOOK_URL=https://myapp.com/webhooks/payment
```

### Step 5: Use It

```typescript
@Injectable()
export class PaymentService {
  constructor(private readonly secrets: ISecretsAdapter) {}
  
  async createCharge() {
    const response = await axios.post('https://api.payment.com/charges', data, {
      headers: { 'Authorization': `Bearer ${this.secrets.PAYMENT.API_KEY}` }
    })
    
    // Webhook URL for callbacks
    await this.registerWebhook(this.secrets.PAYMENT.WEBHOOK_URL)
  }
}
```

## Validation Features

### Required vs Optional

```typescript
// Required (default) - app crashes if missing
API_KEY: InputValidator.string()

// Optional - uses default if missing
DEBUG_MODE: InputValidator.boolean().optional().default(false)
```

### Type Transformation

```typescript
// String from env → Number in code
PORT: InputValidator.number()
  .or(InputValidator.string())
  .transform((p) => Number(p))

// Result: PORT=3000 in .env becomes this.secrets.PORT === 3000 (number)
```

### Format Validation

```typescript
// Must be valid URL
WEBHOOK_URL: InputValidator.string().url()

// Must be valid email  
FROM: InputValidator.string().email()

// Must be one of allowed values
ENV: InputValidator.enum(EnvEnum)  // 'local' | 'dev' | 'hml' | 'prd'
LOG_LEVEL: InputValidator.enum(LogLevelEnum)  // 'debug' | 'info' | 'warn' | 'error'
```

### Nested Objects

```typescript
MONGO: InputValidator.object({
  MONGO_URL: InputValidator.string(),
  MONGO_DATABASE: InputValidator.string(),
  MONGO_EXPRESS_URL: InputValidator.string().url()
})
```

## Error Messages

When validation fails, you get **clear, actionable errors**:

```
❌ App startup failed:

ApiInternalServerException: 
  SecretsService.PAYMENT.API_KEY: Required,
  SecretsService.EMAIL.FROM: Invalid email,
  SecretsService.WEBHOOK_URL: Invalid url
```

Each error tells you:
- **Which service** (SecretsService)
- **Which property** (PAYMENT.API_KEY)
- **What's wrong** (Required, Invalid email, etc.)

## Computed Properties

Some secrets are **computed** from multiple env vars:

```typescript
// service.ts
private getPostgresUrl(): string {
  return (
    this.get('POSTGRES_URL') ??
    `postgresql://${this.get('POSTGRES_USER')}:${this.get('POSTGRES_PASSWORD')}@${this.get(
      'POSTGRES_HOST'
    )}:${this.get('POSTGRES_PORT')}/${this.get('POSTGRES_DATABASE')}`
  )
}

build(): ISecretsAdapter {
  return {
    // ...
    POSTGRES: {
      POSTGRES_URL: this.getPostgresUrl(),
      POSTGRES_PGADMIN_URL: this.get('PGADMIN_URL')
    },
    IS_LOCAL: this.get('NODE_ENV') === EnvEnum.LOCAL,
    IS_PRODUCTION: this.get('NODE_ENV') === EnvEnum.PRD
  }
}
```

Usage:
```typescript
if (this.secrets.IS_PRODUCTION) {
  // Production-only logic
}

// No need to build connection string manually
await mongoose.connect(this.secrets.MONGO.MONGO_URL)
```

## Type Safety with ZodInferSchema

The magic of `ZodInferSchema<ISecretsAdapter>` ensures the validation schema **matches** the adapter interface:

```typescript
// If you add a property to ISecretsAdapter but forget to add validation,
// TypeScript will show an error in schema.ts!

const SecretsSchema = () => InputValidator.object<ZodInferSchema<ISecretsAdapter>>({
  // TypeScript: "Property 'PAYMENT' is missing"
})
```

## Related

- [InputValidator](../utils/validator.md) — Zod wrapper for validation
- [ZodInferSchema](../utils/types.md) — Type utility for schema inference
