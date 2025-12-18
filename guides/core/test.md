# Use Case Testing

Tests for use cases live inside `src/core/{domain}/use-cases/__tests__/` — keeping tests close to the code they validate.

## VS Code Snippet

There's a **snippet** that generates the entire test structure automatically:

```
1. Create a new file: cat-create.spec.ts
2. Type: apitest
3. Press Tab
4. Done! ✨
```

The snippet is located at `.vscode/usecase-test.code-snippets` and generates:
- NestJS test module setup
- `describe` block with `Usecase.name`
- Adapter injection pattern
- Input validation test template

---

## Test Structure

We follow the **NestJS testing pattern** with `@nestjs/testing`:

```typescript
import { Test } from '@nestjs/testing'

describe(CatCreateUsecase.name, () => {  // ✅ Always use ClassName.name
  let usecase: ICatCreateAdapter
  let repository: ICatRepository

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      providers: [
        { provide: ICatRepository, useValue: {} },
        {
          provide: ICatCreateAdapter,
          useFactory: (catRepository: ICatRepository) => {
            return new CatCreateUsecase(catRepository)
          },
          inject: [ICatRepository]
        }
      ]
    }).compile()

    usecase = app.get(ICatCreateAdapter)
    repository = app.get(ICatRepository)
  })

  // tests...
})
```

**Key rule:** `describe()` **always** uses `ClassName.name` — never hardcoded strings.

---

## Test Naming Convention

Follow the pattern: **"when X, should Y"**

```typescript
// ✅ Good naming
test('when no input is specified, should expect an error', ...)
test('when cat created successfully, should expect a cat created', ...)
test('when transaction throws an error, should expect an error', ...)

// ❌ Bad naming
test('test create', ...)
test('error case', ...)
test('it works', ...)
```

---

## Input Validation Test (Mandatory)

Every use case test **must** include input validation:

```typescript
test('when no input is specified, should expect an error', async () => {
  await TestUtils.expectZodError(
    () => usecase.execute({} as CatCreateInput, TestUtils.getMockTracing()),
    (issues: ZodExceptionIssue[]) => {
      expect(issues).toEqual([
        {
          message: 'Invalid input: expected string, received undefined',
          path: TestUtils.nameOf<CatCreateInput>('name')
        },
        {
          message: 'Invalid input: expected string, received undefined',
          path: TestUtils.nameOf<CatCreateInput>('breed')
        },
        {
          message: 'Invalid input: expected number, received undefined',
          path: TestUtils.nameOf<CatCreateInput>('age')
        }
      ])
    }
  )
})
```

---

## `TestUtils.nameOf<T>()` — Type-Safe Paths

**Always** use `nameOf` for field paths:

```typescript
// ✅ Type-safe — compiler catches typos
path: TestUtils.nameOf<CatCreateInput>('name')

// ❌ Not type-safe — typo goes unnoticed
path: 'naem'
```

If you rename a field, TypeScript will catch it at compile time.

---

## Mocking Best Practices

### TestUtils is Mandatory

**Always** use `TestUtils` for mocking — it enforces type safety:

```typescript
// ✅ Type-safe — compiler validates the return type
repository.create = TestUtils.mockResolvedValue<CreatedModel>(input)

// ❌ Not type-safe — no compile-time validation
repository.create = jest.fn().mockResolvedValue(input)
```

This is **mandatory** because:
- Forces you to declare the expected return type
- Compiler catches type mismatches immediately
- Prevents tests from passing with wrong data shapes

See [Test Utils](../tests/util.md) for all available mock methods.

---

### Generating Test Data

Use `ZodMockSchema` to generate test data from schemas:

```typescript
import { ZodMockSchema } from '@mikemajesty/zod-mock-schema'

const mock = new ZodMockSchema(CatEntitySchema)
const input = mock.generate()

test('when cat created successfully, should expect a cat created', async () => {
  repository.create = TestUtils.mockResolvedValue<CreatedModel>(input)

  await expect(usecase.execute(input, TestUtils.getMockTracing())).resolves.toEqual(input)
})
```

For mocking repository methods:

```typescript
// Success case
repository.create = TestUtils.mockResolvedValue<CreatedModel>(input)

// Error case
repository.create = TestUtils.mockRejectedValue(new ApiInternalServerException())
```

See [Mock Utils](../tests/mock.md) for more details.

---

## Coverage Goal

**Target: 100% coverage on use cases.**

Use cases are the core business logic — they must be fully tested:
- ✅ Input validation (empty input)
- ✅ Success scenarios
- ✅ Error scenarios (not found, transaction errors)
- ✅ Edge cases

---

## Related Links

- [Use Case](./usecase.md) — Use case patterns
- [Mock Utils](../tests/mock.md) — Test mocking utilities
- [Test Utils](../tests/util.md) — Testing helpers
