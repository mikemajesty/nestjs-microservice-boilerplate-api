# Core Use-Case Tests

Core tests validate use-case input validation and business behavior with
dependencies replaced by typed test doubles. These are unit tests; do not start
containers or create an HTTP application unless the behavior under test
specifically requires that boundary.

The VS Code `usecasetest` snippet can scaffold the common shape, but it is a
starting point: update its provider dependencies, input types, and expected
validation issues to match the actual use case.

## Location, file name, and suite

- Place tests in `src/core/{domain}/use-cases/__tests__/`.
- Name the file after the use-case source file, adding only `.spec.ts`:
  `user-create.ts` → `user-create.spec.ts`.
- Add a file-level `@see` for this guide.
- Use `describe(UseCase.name, ...)`.
- Name each case `test('when ..., should ...', ...)`.

## Nest testing module and dependency mocks

Use `@nestjs/testing` to construct a fresh use case and its test doubles in
`beforeEach`. Register repository/adapter ports with
`TestUtils.mockProvider(Port)`, then provide the use case through a factory
that injects its dependencies. Retrieve the use case and mocked ports from the
compiled module. Import a real shared module only when its behavior is
intentionally part of the test; for example, some use cases use the real
logger module.

```typescript
beforeEach(async () => {
  const moduleRef = await Test.createTestingModule({
    imports: [],
    providers: [
      TestUtils.mockProvider(ICatRepository),
      {
        provide: ICatCreate,
        useFactory: (repository: ICatRepository) => new CatCreateUsecase(repository),
        inject: [ICatRepository]
      }
    ]
  }).compile()

  usecase = moduleRef.get(ICatCreate)
  repository = moduleRef.get(ICatRepository)
})
```

Configure dependency behavior in each scenario with `TestUtils` helpers:
`mockResolvedValue`, `mockRejectedValue`, `mockReturnValue`, or
`mockImplementation`. Prefer `mockProvider` over hand-built cast provider
objects.

## Input validation

Every use case test includes a validation case for its `@ValidateSchema`
input. Call the use case with intentionally invalid input and use
`TestUtils.expectZodError` to assert **all expected issues**, including the
field paths. Use `TestUtils.nameOf<Input>('field')` for paths so TypeScript
catches renamed or mistyped properties:

```typescript
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

Import `ZodExceptionIssue` from `@/utils/validator`; import `TestUtils`,
`MockUtils`, and `ZodMockSchema` from `@/utils/test`. Match issue order and
messages to the actual schema. If exact wording is not part of the contract,
use a message matcher but still assert the expected field paths.

`expectZodError` fails if the callback completes without throwing and
rethrows errors that are not Zod errors. It reports the first segment of each
issue path; see [TestUtils](../tests/util.md).

## Valid inputs and entity fixtures

Use `ZodMockSchema` from `@/utils/test` to generate valid input from the same
schema used by `@ValidateSchema`. This is the standard for valid `core`
use-case inputs, especially when schemas contain many fields. Use `overrides`
for values that drive the scenario:

```typescript
const input = new ZodMockSchema(CatCreateSchema).generate({
  overrides: { name: 'Milo' }
})

const output = { created: true, id: MockUtils.UUID() }
repository.create = TestUtils.mockResolvedValue<CreatedModel>(output)

await expect(usecase.execute(input, MockUtils.Tracing())).resolves.toEqual(output)
```

For repository fixtures, use the entity schema. Supply `factory` if the test
needs actual entity methods; use `generateMany` for collections and `.clone()`
when independent entity instances are needed:

```typescript
const entity = new ZodMockSchema(CatEntitySchema).generate({
  factory: (data) => new CatEntity(data)
})
```

Prefer generated values for fields irrelevant to a scenario; keep significant
values explicit with overrides. Use `MockUtils` for common IDs and tracing
input, and `MockUtils.faker` for other generated values. Generated Faker
values are not fixed; use a literal or controlled clock when determinism is
required.

## Test coverage

Cover validation, successful behavior, relevant dependency failures, and
business edge cases for each use case. The coverage configuration targets
100% for `src/core`; use coverage reports to find missing branches rather than
adding assertions that do not verify behavior.

See [Test Standards](../tests/standards.md), [TestUtils](../tests/util.md),
and [MockUtils/ZodMockSchema](../tests/mock.md).
