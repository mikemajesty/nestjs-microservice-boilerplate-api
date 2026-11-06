# MockUtils and ZodMockSchema

Import test helpers through the project's barrel:

```typescript
import { MockUtils, MockOptions, ZodMockSchema } from '@/utils/test'
```

Do not import `ZodMockSchema` directly from `@mikemajesty/zod-mock-schema` in
tests. The local barrel is the project's stable import surface.

## MockUtils

`MockUtils` provides shared generated values:

| Helper | Use |
| --- | --- |
| `UUID()` | UUID strings |
| `ObjectId()` | 24-character hexadecimal Mongo ObjectId values |
| `Date()` / `ISODate()` | Faker-generated dates in the past, as `Date` / ISO string |
| `Text(length?)` | Faker-generated lorem words |
| `Number(min?, max?)` | Faker-generated integer in the inclusive range (defaults 0–100) |
| `Boolean()` | Faker-generated boolean |
| `Array(item, length?)` | Array containing the supplied item (defaults to length 3) |
| `User()` | Basic request user with generated ID and `test` name/email |
| `Tracing()` | Tracing input with a generated user |
| `Logger(input?)` | `ILoggerAdapter` whose methods are Jest mocks by default |
| `faker` | The shared Faker instance for other generated values |

Generated values are not fixed constants. If the exact value matters to a
scenario, use a literal or override; if deterministic time is required, use a
fixed date or control `Date.now()` with `TestUtils.spyOn`.

`Array(item)` repeats the same item reference; it does not create independent
copies of object values. Use `.map` or generate/clone separate entities when
each element must be independent.

```typescript
const id = MockUtils.UUID()
const email = MockUtils.faker.internet.email()
const user = MockUtils.User()
const tracing = MockUtils.Tracing()
```

`MockUtils.Logger()` silences logger output and exposes Jest mocks for
assertions. Enable real console logging only while debugging:

```typescript
const logger = MockUtils.Logger({ enableLogger: true })
```

## ZodMockSchema

Use `ZodMockSchema` in tests in **any folder** when a Zod schema describes the
input or fixture. It is especially valuable for large objects: generated
fields stay tied to the schema instead of requiring a manually maintained
object literal. This is the standard for valid `core` use-case input that is
validated by `@ValidateSchema`.

```typescript
const input = new ZodMockSchema(UserCreateSchema).generate()
```

Use `overrides` for values relevant to the scenario, and `factory` when the
test needs an actual class instance with entity behavior:

```typescript
const user = new ZodMockSchema(UserEntitySchema).generate({
  overrides: {
    email: 'user@example.com',
    roles: [role]
  },
  factory: (data) => new UserEntity(data)
})
```

Use `generateMany(count, options)` for collections. Use `.clone()` when a test
needs an independent copy of a generated entity. For a test of validation
failure, create an intentionally invalid value explicitly; do not expect a
schema-based generator to produce invalid data.

Generated values are data, not a guarantee that every business rule or
cross-field invariant is satisfied. Override the fields that drive the
scenario, and validate generated data through the relevant schema when that
is part of the test's purpose.

## Schema evolution and test clarity

Prefer generated values for fields irrelevant to the behavior under test.
Keep significant fields explicit through `overrides`, so the test communicates
why that value matters:

```typescript
const order = new ZodMockSchema(OrderCreateSchema).generate({
  overrides: {
    total: 50_000,
    currency: 'USD'
  }
})
```

Do not assert arbitrary Faker values. Assert the contract, or capture and
assert against the generated value used as input.

See [TestUtils](./util.md) for typed dependency mocks and validation
assertions, and [Test Standards](./standards.md) for layer-specific guidance.
