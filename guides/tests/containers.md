# Testcontainers

The project wrappers in `src/utils/test/e2e/containers.ts` start real MongoDB,
PostgreSQL and Redis containers. Use them for integration tests that need real
infrastructure; unit tests should not start containers.

The current Jest setup runs `test/initialization.ts` for every suite, and that
file checks that Docker is accessible. Therefore, **with the current setup,
even unit-test runs require Docker to be running**. Container tests also need
the database environment variables described below.

Import wrappers from:

```typescript
import { TestMongoContainer, TestPostgresContainer, TestRedisContainer } from '@/utils/test/e2e/containers'
```

## Resource lifecycle

Create one container wrapper per suite, start it in `beforeAll`, isolate test
state between cases, and stop resources in `afterAll`. Container `close()`
stops the Docker container; it does not close every client created from it.
Close direct database connections and data sources explicitly as well.

```typescript
beforeAll(async () => {
  // Start containers and create their clients.
})

afterEach(async () => {
  // Delete only the current test's data, or flush the isolated test Redis DB.
})

afterAll(async () => {
  // Close app/clients/connections/data sources, then stop containers.
})
```

Use the hooks a suite needs. Do not clear a shared database globally unless
the test owns an isolated container/database. Clean up rows created by each
test so failures and order changes do not leak state.

## MongoDB

`TestMongoContainer.getTestMongo()` starts MongoDB and returns a Mongoose
connection for the configured `MONGO_DATABASE`. Set the environment variable
before starting the container; the wrapper also exposes `mongoDatabase` if a
suite needs to override the database name.

The wrapper's `close()` stops the container but does **not** close the returned
Mongoose connection. Close the connection first:

```typescript
const container = new TestMongoContainer()
let connection: mongoose.Connection

beforeAll(async () => {
  ;({ mongoConnection: connection } = await container.getTestMongo())
})

afterEach(async () => {
  await model.deleteMany({})
})

afterAll(async () => {
  await connection.close()
  await container.close()
})
```

Use a unique test database or isolated container. If setting
`container.mongoDatabase`, do so before `getTestMongo()`.

## PostgreSQL

`TestPostgresContainer.getPostgres()` starts PostgreSQL and returns
`postgresConfig`. `getDataSource(options)` initializes a TypeORM `DataSource`.
Set `POSTGRES_DATABASE` before starting the wrapper.

When using the data source directly, destroy it before stopping the
container. When PostgreSQL is initialized through a Nest module, close the
application/module so Nest can release its data source before stopping the
container.

```typescript
const container = new TestPostgresContainer()
let dataSource: DataSource

beforeAll(async () => {
  const { postgresConfig } = await container.getPostgres()
  dataSource = await container.getDataSource(postgresConfig)
})

afterAll(async () => {
  await dataSource.destroy()
  await container.close()
})
```

The wrapper configuration uses the project's migrations, entities and naming
strategy. Test repository behavior against the real `DataSource` rather than
reimplementing that configuration in each suite.

## Redis

`TestRedisContainer.getTestRedis()` starts Redis, exposes its ioredis client as
`container.client`, and returns the project `ICacheAdapter`. Clear test-owned
state between cases, commonly with `flushdb()` for a suite-isolated Redis
container. Do not use `flushall()` against a shared Redis server.

```typescript
const container = new TestRedisContainer()
let cache: ICacheAdapter

beforeAll(async () => {
  cache = await container.getTestRedis()
})

afterEach(async () => {
  await container.client.flushdb()
})

afterAll(async () => {
  await container.close()
})
```

The wrapper disconnects its client and stops its container in `close()`.
Prefer targeted key deletion when a suite shares a client or when flushing
would hide unintended cross-test state.

## Nest HTTP tests

For module/controller HTTP tests, use the existing `TestEnd2EndUtils`:

- `createApp(moduleRef)` creates the project's Fastify Nest application,
  installs the tracing hook and waits until Fastify is ready.
- `getPostgresModule(container, config)` configures the project's named
  PostgreSQL connection and uses the wrapper's data-source factory.
- `AUTHORIZATION_HEADER` supplies the shared test authorization header.

See [Module testing](../modules/test.md) for the application setup, provider
overrides, fixtures, and Supertest patterns. Do not copy standalone
container-only examples into module tests.

## Failure-safe cleanup

If setup starts multiple resources, ensure all successfully started resources
are closed even when a later setup step fails. Register resources before
starting dependent services where possible, and use `try/finally` in custom
setup helpers when ordinary Jest `afterAll` registration cannot cover partial
initialization.

See [Test Standards](./standards.md) for deciding between unit and integration
tests.
