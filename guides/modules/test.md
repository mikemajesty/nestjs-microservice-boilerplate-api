# Module Controller Tests

Module controller tests exercise the HTTP boundary through a real Nest
application and the module wiring. They are integration/end-to-end tests, not
isolated controller unit tests.

## Location and suite

- Keep tests in `src/modules/{domain}/__tests__/controller.spec.ts`.
- Keep HTTP and end-to-end coverage in this file; do not use
  `controller.e2e.spec.ts`.
- Use `describe(Controller.name, ...)` and route-oriented case names, such as
  `it('/GET /users/:id not found', ...)`.
- Add file-level `@see` references to this guide and
  [Test Standards](../tests/standards.md). Add
  [Testcontainers](../tests/containers.md) when the suite uses containers.

See [Test Standards](../tests/standards.md) for shared conventions, response
assertions, and `TestUtils.nameOf` usage.

## Nest application and infrastructure

Use the real module, guards, and infrastructure needed by the endpoint. Use
`TestEnd2EndUtils` for project-specific Fastify, tracing, and PostgreSQL setup:

- `getPostgresModule(container, config)` configures the named PostgreSQL
  connection and the container's data source.
- `createApp(moduleRef)` creates the Fastify Nest application, installs the
  tracing hook, and waits until Fastify is ready.
- `AUTHORIZATION_HEADER` provides the shared test authorization header.

Override providers only when a test intentionally replaces an external
boundary, such as token verification or a repository backed by a test database.
Use `TestUtils` to create typed test doubles; keep other module providers and
guards real. For authenticated requests, set the shared authorization header:

```typescript
const response = await request(app.getHttpServer())
  .get('/users')
  .set(...TestEnd2EndUtils.AUTHORIZATION_HEADER)
  .expect(200)
```

Start only the containers and clients the module needs. Follow
[Testcontainer lifecycle and cleanup guidance](../tests/containers.md) for
starting resources, closing clients/connections, and stopping containers.

## Database fixtures

Use the shared fixture classes in `src/utils/test/e2e/fixtures/` for database
records. Use `FixtureUtils.addBaseSeeds(...)` when the endpoint depends on
related users, roles, or permissions. Keep fixture setup scoped to the records
needed by each scenario; follow [Test Standards](../tests/standards.md) for
test isolation and [Testcontainers](../tests/containers.md) for resource
cleanup.

## Requests and payloads

Use Supertest with `app.getHttpServer()` to exercise the actual route. Omit
the authorization header only in cases specifically testing unauthenticated
behavior. Generate schema-valid request payloads with `ZodMockSchema` when a
Zod schema describes the input; use explicit overrides for scenario-defining
values. See [MockUtils and ZodMockSchema](../tests/mock.md).

Assert the HTTP status and the response fields relevant to the endpoint's
contract. Follow [Test Standards](../tests/standards.md) for the required
`toHaveProperty` typing: use the use-case output type for successful responses
and `BaseException` for standard error fields such as `message`.
