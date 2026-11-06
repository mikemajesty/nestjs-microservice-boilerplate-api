# TestUtils

`TestUtils` is the project's shared Jest helper. Import it from `@/utils/test`;
the barrel exports both `TestUtils` and `MockUtils`.

## Typed mocks

Use the helper that matches the dependency method's contract:

```typescript
import { TestUtils } from '@/utils/test'

const find = TestUtils.mockResolvedValue<UserEntity | null>(null)
const create = TestUtils.mockResolvedValue<CreatedModel>({
  created: true,
  id: 'user-id'
})
const verify = TestUtils.mockRejectedValue<UserRequest>(new Error('Invalid token'))
const emit = TestUtils.mockReturnValue<EmitEventOutput>()
```

- `mock<T>()` creates a Jest mock function.
- `mockResolvedValue<T>()` and `mockResolvedValueOnce<T>()` create promise
  mocks. Use `T` for the method's resolved value.
- `mockRejectedValue<T>()` and `mockRejectedValueOnce<T>()` create rejected
  promise mocks.
- `mockReturnValue<T>()` creates a synchronous return-value mock.
- `mockImplementation<T>()` installs a scenario-specific implementation.
  Prefer the simpler value helpers when they express the test.
- `mockProvider(Token, methods?)` creates a Nest provider using a partial,
  typed mock object. Use it in `Test.createTestingModule`; configure only the
  dependency methods needed by the scenario.
- `spyOn(object, method)` creates a Jest spy for an existing method.
- `clearMocks()` clears Jest mock usage data (calls, results, instances) but
  keeps implementations and return values; `restoreMocks()` restores spies.
  Use `afterEach` when a suite mutates shared mocks or global methods.

Example Nest provider setup:

```typescript
providers: [
  TestUtils.mockProvider(IUserRepository),
  TestUtils.mockProvider(IEventAdapter, {
    emit: TestUtils.mockReturnValue<EmitEventOutput>()
  })
]
```

In `core` use-case tests, prefer `TestUtils.mockProvider` for dependency ports,
retrieve the mocked providers from the compiled testing module, and configure
the behavior in each test.

## Assertions and schema validation

`nameOf<T>()` returns a top-level property key with TypeScript checking. Use it
for DTO/entity property assertions and Zod issue paths:

```typescript
expect(response.body).toHaveProperty(TestUtils.nameOf<UserOutput>('email'))
```

`expectZodError(callback, assertion)` awaits the callback, requires it to throw
a Zod error, maps each issue to `{ message, path }` using the first path
segment, and passes those mapped issues to the assertion callback. A successful
callback fails the test; a non-Zod error is rethrown rather than treated as
validation success.

```typescript
await TestUtils.expectZodError(
  () => usecase.execute({} as UserCreateInput, MockUtils.Tracing()),
  (issues) => {
    expect(issues).toEqual(
      expect.arrayContaining([
        {
          message: expect.any(String),
          path: TestUtils.nameOf<UserCreateInput>('email')
        }
      ])
    )
  }
)
```

For payloads or fixtures based on Zod schemas, use `ZodMockSchema` from
`@/utils/test`; see [MockUtils and ZodMockSchema](./mock.md). Keep invalid
validation input intentionally invalid instead of generating it from a schema
that produces valid values.

## Scope of common helpers

Use `TestUtils` for reusable mocking and assertion mechanics, not for
domain-specific fixture objects. Use `MockUtils` for shared values such as
UUIDs, tracing context and Faker access. Keep one-off scenario data in the
test, and keep reusable database fixture setup in the relevant fixture class.

See [Test Standards](./standards.md) for layer-specific setup and naming.
