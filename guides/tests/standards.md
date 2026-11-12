# Test Standards

These are the canonical conventions for creating tests in this repository.
Start by identifying the layer and behavior under test; do not apply a
controller, Nest testing module, or container pattern to a test that does not
need it.

## Test runner and shared conventions

- Place TypeScript tests under the corresponding source folder in
  `src/**/__tests__/` and name them `*.spec.ts`. Jest's current config only
  discovers `.spec.ts` files under `src`.
- Use `describe(Class.name, ...)` for the unit under test. Add nested
  `describe` blocks to group meaningful behaviors.
- For new non-module tests, use `test('when ..., should ...', ...)`. Module
  controller tests keep route-oriented names such as
  `it('/GET /users/:id not found', ...)`.
- Assert observable behavior and relevant outputs, not implementation details
  that are not part of the contract.
- Use `@see` links to the relevant test/layer guide at the top of a test file.
- For response fields asserted with `toHaveProperty`, always use
  `TestUtils.nameOf<T>('field')`. Use the use-case output type for successful
  responses (or the controller's declared return type when it returns directly
  without a use case) and `BaseException` for standard error fields such as
  `message`:

```typescript
expect(response.body).toHaveProperty(TestUtils.nameOf<UserCreateOutput>('id'))
expect(errorResponse.body).toHaveProperty(TestUtils.nameOf<BaseException>('message'))
```

- Run a focused suite with `npm test -- --runInBand path/to/file.spec.ts`.
  The current `test/initialization.ts` checks Docker for every suite, so Docker
  must be accessible even when running unit tests.

## Shared test utilities and data

- Import `TestUtils`, `MockUtils`, `ZodMockSchema`, and related helpers from
  `@/utils/test`. Avoid direct imports from the Zod mock library or old
  `@/utils/test/util`, `mock`, or `containers` paths.
- Use `TestUtils` for typed Jest mocks, Nest `mockProvider` setup, spies, and
  validation assertions. Restore spies and clear shared mock calls in
  `afterEach` when a suite changes global methods or reuses mock instances.
- Use `MockUtils` for UUIDs, Mongo ObjectIds, dates, text, numbers, booleans,
  arrays, request users, tracing input, and logger mocks. Use
  `MockUtils.faker` for additional generated values.
- Generated Faker values are not fixed or automatically reproducible. Use
  literals or schema `overrides` when values determine behavior or assertions;
  use a fixed date or spy on time for deterministic time-sensitive tests.
- `MockUtils.Array(item)` repeats the same value/reference. Create separate
  objects or entities explicitly when the array needs independent instances.
- Use `MockUtils.Logger()` rather than constructing and casting partial
  `ILoggerAdapter` objects. Its methods are Jest mocks by default; enable
  console logging only to debug a test.
- `ZodMockSchema` may be used in any test folder when a Zod schema describes
  its input or fixture. Use generated values for irrelevant fields and
  overrides for scenario-defining fields. Use `factory` for real entity
  instances, `generateMany` for collections, and `.clone()` for independent
  entity copies. Generated values do not replace business-invariant checks.
- Keep invalid data intentionally invalid in validation tests; don't use a
  generator configured to produce valid schema values for that purpose.

See [TestUtils](./util.md) and [MockUtils/ZodMockSchema](./mock.md).

## Core use-case tests

Core tests validate business behavior with dependency ports replaced by typed
test doubles. Follow [Core testing](../core/test.md).

### Location, filename, and setup

- Use `src/core/{domain}/use-cases/__tests__/`.
- Name the file after the use-case source file, adding only `.spec.ts`:
  `user-create.ts` → `user-create.spec.ts`.
- Use `describe(UseCase.name, ...)`.
- Use `@nestjs/testing` and a fresh `Test.createTestingModule(...)` in
  `beforeEach`. Register dependency ports with `TestUtils.mockProvider(Port)`,
  then register the use case through a `useFactory`, inject its dependencies,
  and retrieve both the use case and its mocks from the compiled module.
- Use a real application module only when testing module wiring is itself the
  requirement; ordinary use-case tests should construct only the use case and
  mocked ports they need.

### Validation, fixtures, and coverage

- For valid inputs to use cases decorated with `@ValidateSchema`, generate
  data from that use case's input schema with `ZodMockSchema`.
- Include an input-validation test for each use case. Use
  `TestUtils.expectZodError` and assert the expected issues, including the
  paths for invalid fields. Use `TestUtils.nameOf<Input>('field')` for each
  path so the compiler catches renamed or mistyped input properties:

```typescript
import { MockUtils, TestUtils } from '@/utils/test'
import { ZodExceptionIssue } from '@/utils/validator'

await TestUtils.expectZodError(
  () => usecase.execute({} as CatCreateInput, MockUtils.Tracing()),
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
```

Keep the issue ordering/messages aligned with the actual schema and validator.
When wording is intentionally not part of the contract, assert messages with
an appropriate matcher while still checking every relevant path. See
[TestUtils](./util.md) for the helper's failure behavior.
- Generate entity fixtures from entity schemas. Supply `factory` when the
  tested behavior depends on entity methods. Override relationships and
  values relevant to each scenario; clone when mutation or independent state
  matters.
- Cover success, validation, dependency failures, and business edge cases.
- Configure return values in the test scenario with `TestUtils` methods such
  as `mockResolvedValue`, `mockRejectedValue`, `mockReturnValue`, and
  `mockImplementation`.

## Module controller HTTP tests

For controller HTTP and end-to-end tests, use
`src/modules/{domain}/__tests__/controller.spec.ts` and route-oriented case
names. Follow [Module controller tests](../modules/test.md) for Nest wiring,
Supertest, and fixture setup, and [Testcontainers](./containers.md) for
container lifecycle. The shared response-property assertion convention is
defined above.

## Other folders

Use the pattern appropriate to the unit under test; these folders do not
automatically require a Nest test module or HTTP server.

### Infrastructure (`src/infra`)

- Place tests beside the infrastructure service/adapter under
  `src/infra/{area}/__tests__/`.
- If both levels exist, use `unit.spec.ts` for isolated service behavior and
  `integration.spec.ts` for real dependency/infrastructure behavior. If there
  is only one focused suite, use a descriptive source-based name such as
  `service.spec.ts` or `util.spec.ts`.
- Unit tests should instantiate the service directly and replace only its
  dependency boundary with `TestUtils` mocks. Do not add a Nest test module
  unless Nest DI behavior is under test.
- Integration tests should exercise the real adapter/dependency. Use
  Testcontainers for real MongoDB, PostgreSQL, or Redis; close direct clients,
  Mongoose connections, TypeORM data sources, and the Nest app as applicable.
- Isolate and clean test state between cases. Use targeted deletes or
  suite-owned `flushdb()` for Redis; never flush a shared external service.
- An HTTP client may use a local scripted HTTP server for integration tests;
  use `beforeAll`/`afterAll` to start/close it and reset its request/reply
  state between cases.

### Utilities, decorators, and middleware

- Place utility tests in `src/utils/__tests__/`, decorator tests in
  `src/utils/decorators/__tests__/`, and middleware tests beside their
  middleware under `src/middlewares/**/__tests__/`.
- Use a descriptive filename matching the tested source unit, such as
  `deadline.spec.ts` or `request-timeout.interceptor.spec.ts`.
- Call pure utilities directly. Invoke decorators through a small local class
  and assert the behavior of the decorated method. For guards/interceptors,
  create typed minimal execution contexts and handlers; use Nest testing
  utilities only when DI or framework wiring is part of the behavior.
- Restore spies and reset shared mocks/global state after each case. Use
  deterministic clocks and controlled observables/promises for timing and
  concurrency behavior.

## Testcontainers and cleanup

Use the wrappers from `@/utils/test/e2e/containers`, not direct container
construction, unless a test explicitly requires a different image or setup.
The wrapper APIs and their connection-cleanup requirements are documented in
[Testcontainers](./containers.md).

Always clean resources owned by the test. A container's `close()` does not
close every separately created database connection/data source; release those
clients too. Do not rely on `forceExit` to hide open handles or leaked state.

## Related

- [Core use-case tests](../core/test.md)
- [Module controller tests](../modules/test.md)
- [TestUtils](./util.md)
- [MockUtils and ZodMockSchema](./mock.md)
- [Testcontainers](./containers.md)
