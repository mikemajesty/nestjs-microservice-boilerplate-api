# Module Controller Tests

Module tests verify the HTTP/API boundary and real Nest module wiring. These
are integration/end-to-end tests, not isolated controller unit tests.

## Location, file name, and suite

- Keep tests in `src/modules/{domain}/__tests__/`.
- Name the HTTP suite `controller.spec.ts`, including end-to-end coverage.
  Do not use `controller.e2e.spec.ts`.
- Use `describe(Controller.name, ...)`.
- Add a file-level `@see` for this guide.
- Use the endpoint and scenario in case names, for example
  `it('/GET /users/:id not found', ...)`. Keep descriptions specific to the
  route and expected result.

## Application setup

Use the real module, guards, and infrastructure that the module needs. Use
`TestEnd2EndUtils` rather than duplicating its Fastify, tracing, or PostgreSQL
configuration:

1. Declare the required `TestMongoContainer`, `TestPostgresContainer`, and/or
   `TestRedisContainer` at the suite level.
2. In `beforeAll`, start the containers, build the Nest testing module, and
   override only dependencies the test intentionally substitutes.
3. Use `TestEnd2EndUtils.getPostgresModule(...)` for the project's PostgreSQL
   connection and `TestEnd2EndUtils.createApp(moduleRef)` to create and ready
   the Fastify application.
4. Retrieve repositories/adapters from `moduleRef` for fixture setup.
5. In `afterAll`, close the app and clients/connections before stopping their
   containers. Follow [container lifecycle guidance](../tests/containers.md).

Use `.overrideProvider(...).useValue(...)` for intentional test doubles such
as token verification or a repository backed by a test database. Keep other
module providers and guards real. Prefer `TestUtils` for typed mocked methods.
For authenticated requests, use
`request(app.getHttpServer()).set(...TestEnd2EndUtils.AUTHORIZATION_HEADER)`;
omit the header in tests explicitly covering unauthenticated behavior.

```typescript
describe(UserController.name, () => {
  let app: INestApplication
  let userRepository: IUserRepository

  const postgresContainer = new TestPostgresContainer()
  const redisContainer = new TestRedisContainer()

  beforeAll(async () => {
    const { postgresConfig } = await postgresContainer.getPostgres()
    const cache = await redisContainer.getTestRedis()

    const moduleRef = await Test.createTestingModule({
      imports: [UserModule, GuardsModule, TestEnd2EndUtils.getPostgresModule(postgresContainer, postgresConfig)]
    })
      .overrideProvider(ICacheAdapter)
      .useValue(cache)
      .compile()

    app = await TestEnd2EndUtils.createApp(moduleRef)
    userRepository = moduleRef.get(IUserRepository)
  })

  afterAll(async () => {
    await app.close()
    await postgresContainer.close()
    await redisContainer.close()
  })
})
```

Add MongoDB or token-provider overrides only when the module under test needs
them. Keep the setup in the example minimal rather than starting unused
containers.

## Fixtures and state isolation

- Use the existing fixture classes in `src/utils/test/e2e/fixtures/` for
  shared database entities. Use `FixtureUtils.addBaseSeeds(...)` when fixtures
  need connected roles, permissions, or users.
- After retrieving repositories in `beforeAll`, clear stale fixture records
  with each fixture's `down` method, then prepare shared relationships/seeds.
- Use `beforeEach` to insert the records required by each request.
- Use `afterEach` to remove per-test records and targeted Redis keys.
- Use `afterAll` for final cleanup and closing app, clients, connections and
  containers.
- Only add hooks and containers that the suite actually uses. Stateless
  endpoints such as health checks do not need database fixtures.

The lifecycle in a suite is conceptually:

```typescript
beforeAll(async () => {
  // Start dependencies, create the app, retrieve repositories, prepare fixtures.
})

beforeEach(async () => {
  // Seed the rows required by this test.
})

afterEach(async () => {
  // Remove rows and keys created by this test.
})

afterAll(async () => {
  // Clean shared fixtures, close app/clients, then stop containers.
})
```

Jest runs `beforeEach` before a test and `afterEach` after it regardless of
their declaration order. Prefer declaring setup before cleanup for readability.

## Requests, payloads, and assertions

Use Supertest against the real application:

```typescript
const response = await request(app.getHttpServer())
  .post('/users')
  .set(...TestEnd2EndUtils.AUTHORIZATION_HEADER)
  .send(input)
  .expect(201)

expect(response.body).toHaveProperty(TestUtils.nameOf<UserCreateOutput>('id'))
```

- Generate schema-valid request payloads with `ZodMockSchema` from
  `@/utils/test` when a Zod schema describes the request. This applies to
  modules as well as `core`.
- Keep scenario-defining values explicit through `overrides` or literals.
- Use `TestUtils.nameOf<Output>('field')` for type-checked response property
  names.
- Assert status and the response properties relevant to the endpoint's
  contract; do not make a status-only assertion for successful responses
  where output shape matters.
- Cover success, authentication/authorization, validation, not-found, and
  other endpoint-specific error behavior as applicable.

See [Test Standards](../tests/standards.md) and
[Testcontainers](../tests/containers.md).
