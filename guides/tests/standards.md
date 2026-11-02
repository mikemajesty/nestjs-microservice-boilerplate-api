# Test Standards

Tests in `core` and `modules` have dedicated guides. For tests in other parts of
the application, follow these shared conventions while preserving the
unit/integration distinction.

## Suite and test names

- Use `describe(ClassName.name, ...)` for a class under test.
- For exported functions, use `describe(functionName.name, ...)`; group related
  functions under a descriptive name only when a class/function name would be
  misleading.
- Name tests after the expected behavior, using `should ...` (or
  `when ..., should ...` when the condition adds useful context).
- Keep setup shared by scenarios in `beforeEach`/`beforeAll` instead of
  repeating it in every test.

## Unit tests

- Put unit tests near the implementation in `__tests__` and name files
  `*.spec.ts`.
- Instantiate the class directly when a Nest testing module adds no value.
- Use `TestUtils` for mocks, spies, and mock cleanup. Prefer typed mocks over
  raw `jest.fn()` when mocking application dependencies.
- Keep each test focused on observable behavior and assert relevant side
  effects as well as the result.

```typescript
describe(MyService.name, () => {
  let service: MyService
  const load = TestUtils.mockResolvedValue<MyValue>()

  beforeEach(() => {
    service = new MyService({ load })
  })

  afterEach(() => {
    TestUtils.restoreMocks()
    TestUtils.clearMocks()
  })

  it('should return the loaded value', async () => {
    load.mockResolvedValue(value)

    await expect(service.get()).resolves.toEqual(value)
    expect(load).toHaveBeenCalledTimes(1)
  })
})
```

## Integration tests

- Exercise the real boundary being tested: use a local server for HTTP behavior
  or the existing test containers for infrastructure dependencies.
- Keep infrastructure setup and teardown in lifecycle hooks, and isolate test
  state between cases.
- Use small helpers or fixtures for repeated setup; do not mock away the
  boundary whose integration behavior the test is meant to verify.
- Use the same suite naming, behavior naming, and `@see` conventions as unit
  tests.

## Documentation reference

Add a top-of-file `@see` pointing to both this guide and the documentation for
the component being tested:

```typescript
/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/tests/standards.md
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/infra/http.md
 */
```

## Related

- [Core testing](../core/test.md)
- [Module testing](../modules/test.md)
- [Test utilities](./util.md)
- [Testcontainers](./containers.md)
