# Validator

Multi-language validation system that automatically adapts error messages to user's preferred language while providing centralized validation logic for the entire application.

## Language Support

The validator system supports automatic language detection and translation of validation error messages:

### Supported Languages
- **English (en-US)** - Default fallback
- **Portuguese (pt-BR)** - Brazilian Portuguese  
- **Spanish (es-ES)** - Spanish

### How Language Changes Work

The system automatically adapts validation messages based on user context:

```typescript
// User requests come with Accept-Language header
// Validation errors are automatically translated

// Portuguese user sees:
"Campo obrigatório"
"E-mail inválido"
"CPF inválido"

// English user sees:  
"Required field"
"Invalid email"
"Invalid CPF"

// Spanish user sees:
"Campo requerido"
"Correo electrónico no válido"
"CPF inválido"
```

### Language Configuration

The system initializes with a default language defined in `main.ts` and can be changed dynamically:

```typescript
// main.ts - Set application-wide default language
async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  
  // Initialize validation system with default language
  await initI18n('pt-BR') // Brazilian Portuguese as default
  
  await app.listen(8080)
}

// Change language dynamically during runtime
await changeLanguage('en-US') // Switch to English
await changeLanguage('es-ES') // Switch to Spanish
```

### How It Benefits Users

**For End Users:**
- Receive validation errors in their native language
- Better user experience with localized messages
- Consistent terminology across different features

**For Developers:**
- Write validation logic once, get translations automatically
- No need to manage error message translations manually
- Consistent validation patterns across the entire application

## Centralized Validation

The `InputValidator` serves as the single entry point for all validation needs in the application:

### Why Centralization Matters

Instead of importing Zod directly throughout the app, everything goes through `InputValidator`:

```typescript
// ❌ Don't import Zod directly
import { z } from 'zod'

// ✅ Use centralized InputValidator  
import { InputValidator } from '@/utils/validator'

// All standard Zod functionality available
const UserSchema = InputValidator.object({
  email: InputValidator.string().email(),
  age: InputValidator.number().min(18),
  name: InputValidator.string().min(2)
})
```

### Benefits of Centralization

- **Consistent behavior**: All validations use the same internationalization setup
- **Easy maintenance**: Update validation logic in one place
- **Enhanced functionality**: Additional validators beyond standard Zod
- **Type safety**: Full TypeScript support with proper inference

## Brazilian Document Validation

For Brazilian market applications, the system includes specialized validators:

```typescript
// Brazilian-specific validations
const BrazilianUserSchema = InputValidator.object({
  cpf: InputValidator.cpf(),        // Brazilian individual tax ID
  cnpj: InputValidator.cnpj(),      // Brazilian company tax ID  
  rg: InputValidator.rg(),          // Brazilian identity document
  cep: InputValidator.cep(),        // Brazilian postal code
  phone: InputValidator.phoneBR()   // Brazilian phone format
})
```

These validators automatically format and validate Brazilian documents, handling common input variations (with/without masks) and providing localized error messages.

## Integration with @ValidateSchema

The validator works seamlessly with the `@ValidateSchema` decorator used throughout the application's use cases, automatically applying internationalization to all validation errors without additional configuration.