# Module Testing (E2E)

End-to-end tests for modules live inside `src/modules/{domain}/__tests__/`. These tests use **Testcontainers** to spin up real databases, making them true integration tests.

## Location & Naming Conventions

| Convention | Pattern | Example |
|------------|---------|---------|
| **Folder** | `src/modules/{domain}/__tests__/` | `src/modules/cat/__tests__/` |
| **File** | `controller.e2e.spec.ts` or `controller.spec.ts` | `controller.e2e.spec.ts` |
| **Describe** | `{Domain}Controller` | `describe('CatController', ...)` |

---

## Test Structure

```typescript
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'

import { ICatRepository } from '@/core/cat/repository/cat'
import { ICacheAdapter } from '@/infra/cache'
import { TestMongoContainer, TestRedisContainer } from '@/utils/test/containers'

import { CatModule } from '../module'
import { CatRepository } from '../repository'

describe('CatController', () => {
  let app: INestApplication
  let repository: ICatRepository

  const containerMongo = new TestMongoContainer()
  const containerRedis = new TestRedisContainer()

  beforeAll(async () => {
    // 1. Start containers
    const { mongoConnection } = await containerMongo.getTestMongo(ConnectionName.CATS)

    // 2. Build test module with overrides
    const moduleRef = await Test.createTestingModule({
      imports: [CatModule]
    })
      .overrideProvider(ICatRepository)
      .useFactory({ factory() { return new CatRepository(...) } })
      .overrideProvider(ICacheAdapter)
      .useFactory({ factory() { return containerRedis.getTestRedis() } })
      .compile()

    // 3. Create app instance
    app = moduleRef.createNestApplication()
    repository = app.get(ICatRepository)
    await app.init()
  })

  it(`/GET /v1/cats`, async () => {
    // Test HTTP endpoint
  })

  afterAll(async () => {
    // 4. Cleanup containers
    await containerMongo.close()
    await containerRedis.close()
    await app.close()
  })
})
```

---

## Testcontainers

We use wrapper classes from `@/utils/test/containers`:

| Container | Class | Database |
|-----------|-------|----------|
| MongoDB | `TestMongoContainer` | Mongoose |
| PostgreSQL | `TestPostgresContainer` | TypeORM |
| Redis | `TestRedisContainer` | Cache |

See [Containers](../tests/containers.md) for detailed usage.

---

## MongoDB Example (Cat)

```typescript
import { TestMongoContainer, TestRedisContainer } from '@/utils/test/containers'

describe('CatController', () => {
  const containerMongo = new TestMongoContainer()
  const containerRedis = new TestRedisContainer()

  beforeAll(async () => {
    const { mongoConnection } = await containerMongo.getTestMongo(ConnectionName.CATS)

    const moduleRef = await Test.createTestingModule({
      imports: [CatModule]
    })
      .overrideProvider(ICatRepository)
      .useFactory({
        factory() {
          type Model = mongoose.PaginateModel<CatDocument>
          const repository: PaginateModel<CatDocument> = mongoConnection.model<CatDocument, Model>(
            Cat.name,
            CatSchema as Schema
          )
          return new CatRepository(repository)
        }
      })
      .overrideProvider(ICacheAdapter)
      .useFactory({
        async factory(): Promise<RedisService> {
          const redis = await containerRedis.getTestRedis()
          return redis
        }
      })
      .compile()

    app = moduleRef.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await containerMongo.close()
    await containerRedis.close()
    await app.close()
  })
})
```

---

## PostgreSQL Example (User)

```typescript
import { TestPostgresContainer, TestRedisContainer } from '@/utils/test/containers'

describe('UserController', () => {
  const postgresContainer = new TestPostgresContainer()
  const redisContainer = new TestRedisContainer()

  beforeAll(async () => {
    const postgresConnection = await postgresContainer.getTestPostgres()

    const moduleRef = await Test.createTestingModule({
      imports: [
        UserModule,
        TypeOrmModule.forRootAsync({
          useFactory: () => {
            return postgresContainer.getConfiguration(postgresConnection, __dirname)
          },
          async dataSourceFactory(options) {
            return await postgresContainer.getDataSource(options)
          }
        })
      ]
    })
      .overrideProvider(IUserRepository)
      .useFactory({
        factory(repository: Repository<UserSchema & UserEntity>) {
          return new UserRepository(repository)
        },
        inject: [getRepositoryToken(UserSchema)]
      })
      .overrideProvider(ICacheAdapter)
      .useFactory({
        async factory(): Promise<RedisService> {
          return await redisContainer.getTestRedis()
        }
      })
      .compile()

    app = moduleRef.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await postgresContainer.close()
    await redisContainer.close()
    await app.close()
  })
})
```

---

## HTTP Testing with Supertest

Use `supertest` for HTTP assertions:

```typescript
import request from 'supertest'

it(`/GET /v1/cats`, async () => {
  // Seed data
  const input = new ZodMockSchema(CatEntitySchema).generate()
  await repository.create(new CatEntity(input))

  // Make request with auth token
  return request(app.getHttpServer())
    .get('/cats')
    .set('Authorization', `Bearer ${process.env.TOKEN_TEST}`)
    .expect(200)
})
```

---

## Key Patterns

1. **Container instances** — Declare at describe level, reuse across tests
2. **beforeAll** — Start containers, build module, init app
3. **afterAll** — Close containers and app (cleanup)
4. **overrideProvider** — Replace real providers with test containers
5. **TOKEN_TEST** — Use env variable for auth token in tests

---

## Related Links

- [Containers](../tests/containers.md) — Testcontainers wrappers
- [Module](./module.md) — Module structure
- [Controller](./controller.md) — Controller patterns
- [Test Utils](../tests/util.md) — Testing helpers
