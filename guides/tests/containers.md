# Test Containers

Real infrastructure testing with Docker containers that eliminate the need for mocking databases and external services. Uses [Testcontainers](https://testcontainers.com/) to provide **isolated, reproducible integration and end-to-end tests** with actual database instances.

## Why Testcontainers is a Game Changer

### The Mocking Problem

Traditional integration testing relies on mocks that don't reflect real-world behavior:

```typescript
// ❌ MOCKED TESTING: Doesn't catch real database issues
const mockRepository = {
  save: jest.fn().mockResolvedValue({ id: '123' }),
  findById: jest.fn().mockResolvedValue(mockUser)
}

// Tests pass but may fail in production with:
// - Database constraint violations
// - Connection pool issues
// - Query performance problems
// - Transaction isolation issues
```

### Real Infrastructure Testing

Testcontainers solves this by providing **actual database instances** in containers:

```typescript
// ✅ REAL TESTING: Catches actual database behavior
const mongoContainer = new TestMongoContainer()
const { mongoConnection } = await mongoContainer.getTestMongo(ConnectionName.USER)

// Tests run against real MongoDB with:
// - Actual query execution
// - Real indexing behavior
// - Genuine constraint enforcement
// - Transaction consistency
```

## Available Containers

### MongoDB Container

Perfect for testing document-based operations, aggregations, and text search:

```typescript
import { TestMongoContainer } from '@/utils/test/e2e/containers'

describe('User Repository Integration', () => {
  let mongoContainer: TestMongoContainer
  let userRepository: UserRepository

  beforeAll(async () => {
    mongoContainer = new TestMongoContainer()
    const { mongoConnection } = await mongoContainer.getTestMongo(ConnectionName.USER)

    userRepository = new UserRepository(mongoConnection.model('User', userSchema))
  })

  afterAll(async () => {
    await mongoContainer.close()
  })

  it('should save and retrieve user with complex data', async () => {
    const userData = {
      id: TestUtils.getMockUUID(),
      name: 'John Doe',
      email: 'john@example.com',
      profile: {
        preferences: {
          theme: 'dark',
          language: 'pt-BR'
        },
        metadata: {
          lastLogin: new Date(),
          loginCount: 5
        }
      }
    }

    // Test actual MongoDB operations
    await userRepository.save(new UserEntity(userData))
    const foundUser = await userRepository.findById(userData.id)

    expect(foundUser).toBeDefined()
    expect(foundUser.profile.preferences.theme).toBe('dark')
    expect(foundUser.profile.metadata.loginCount).toBe(5)
  })

  it('should handle MongoDB text search', async () => {
    await userRepository.save(
      new UserEntity({
        id: '1',
        name: 'João Silva',
        email: 'joao@example.com'
      })
    )
    await userRepository.save(
      new UserEntity({
        id: '2',
        name: 'Maria Santos',
        email: 'maria@example.com'
      })
    )

    // Test MongoDB text search capabilities
    const results = await userRepository.searchByText('João')
    expect(results).toHaveLength(1)
    expect(results[0].name).toBe('João Silva')
  })
})
```

### PostgreSQL Container

Ideal for testing relational data, constraints, transactions, and complex queries:

```typescript
import { ICacheAdapter } from '@/infra/cache'
import { TestPostgresContainer, TestRedisContainer } from '@/utils/test/e2e/containers'
import { TestEnd2EndUtils } from '@/utils/test/e2e/utils'

describe('Order Service Integration', () => {
  let app: INestApplication
  let redisService: ICacheAdapter

  const postgresContainer = new TestPostgresContainer()
  const redisContainer = new TestRedisContainer()

  beforeAll(async () => {
    const { postgresConfig } = await postgresContainer.getPostgres()
    redisService = await redisContainer.getTestRedis()

    const moduleRef = await Test.createTestingModule({
      imports: [OrderModule, TestEnd2EndUtils.getPostgresModule(postgresContainer, postgresConfig)]
    })
      .overrideProvider(IOrderRepository)
      .useFactory({
        factory(repository: Repository<OrderModel>) {
          return new OrderRepository(repository)
        },
        inject: [getRepositoryToken(OrderSchema)]
      })
      .overrideProvider(ICacheAdapter)
      .useValue(redisService)
      .compile()

    app = moduleRef.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await postgresContainer.close()
    await redisContainer.close()
    await app.close()
  })

  it('should create an order', async () => {
    const response = await request(app.getHttpServer())
      .post('/orders')
      .send({ customerId: TestUtils.getMockUUID(), total: 99.99 })
      .expect(201)

    expect(response.body).toHaveProperty('id')
    expect(response.body).toHaveProperty('created', true)
  })

  it('should enforce unique constraints', async () => {
    const response = await request(app.getHttpServer()).post('/orders').send({ customerId: 'invalid-id', total: 0 })
    expect(response.status).toBe(400)
  })
})
```

### Redis Container

Perfect for testing caching, session management, and real-time features:

```typescript
import { ICacheAdapter } from '@/infra/cache'
import { TestRedisContainer } from '@/utils/test/e2e/containers'

describe('Cache Service Integration', () => {
  let redisContainer: TestRedisContainer
  let cacheService: ICacheAdapter

  beforeAll(async () => {
    redisContainer = new TestRedisContainer()
    cacheService = await redisContainer.getTestRedis()
  })

  afterAll(async () => {
    await redisContainer.close()
  })

  it('should cache and retrieve a value', async () => {
    const key = 'user:profile:123'
    const value = JSON.stringify({ id: '123', name: 'John Doe' })

    await cacheService.set(key, value)
    const cached = await cacheService.get(key)

    expect(cached).toBe(value)
  })

  it('should return null for a missing key', async () => {
    const result = await cacheService.get('non:existent:key')
    expect(result).toBeNull()
  })

  it('should delete a key', async () => {
    const key = 'temp:data'
    await cacheService.set(key, 'value')
    await cacheService.del(key)
    expect(await cacheService.get(key)).toBeNull()
  })
})
```

## End-to-End Testing with Multiple Containers

```typescript
import { ICacheAdapter } from '@/infra/cache'
import { TestMongoContainer, TestPostgresContainer, TestRedisContainer } from '@/utils/test/e2e/containers'
import { TestEnd2EndUtils } from '@/utils/test/e2e/utils'

describe(CatController.name, () => {
  let app: INestApplication
  let redisService: ICacheAdapter

  const mongoContainer = new TestMongoContainer()
  const postgresContainer = new TestPostgresContainer()
  const redisContainer = new TestRedisContainer()

  beforeAll(async () => {
    const { mongoConnection } = await mongoContainer.getTestMongo(ConnectionName.CATS)
    const { postgresConfig } = await postgresContainer.getPostgres()
    redisService = await redisContainer.getTestRedis()

    const moduleRef = await Test.createTestingModule({
      imports: [CatModule, TestEnd2EndUtils.getPostgresModule(postgresContainer, postgresConfig)]
    })
      .overrideProvider(ICatRepository)
      .useFactory({
        factory() {
          const repository = mongoConnection.model<CatDocument, PaginateModel<CatDocument>>(
            Cat.name,
            CatSchema as Schema
          )
          return new CatRepository(repository)
        }
      })
      .overrideProvider(ICacheAdapter)
      .useValue(redisService)
      .compile()

    app = moduleRef.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await mongoContainer.close()
    await redisContainer.close()
    await postgresContainer.close()
    await app.close()
  })
})
```

## Configuration Management

### Environment Variables

Containers automatically use environment variables for database names:

```typescript
// Required environment variables
MONGO_DATABASE = test_app_db
POSTGRES_DATABASE = test_app_db

// Containers use these for consistent naming
const mongoContainer = new TestMongoContainer()
// Uses MONGO_DATABASE for database name

const postgresContainer = new TestPostgresContainer()
// Uses POSTGRES_DATABASE for database name
```

### Path Configuration for PostgreSQL

```typescript
// Automatically loads migrations and entities
const { postgresConfig } = await postgresContainer.getPostgres()

// postgresConfig includes:
// - Migrations: /src/infra/database/postgres/migrations/
// - Entities: /src/infra/database/postgres/schemas/
// - Naming strategy: SnakeNamingStrategy
// - Auto-run migrations: true

// Pass to module setup:
TestEnd2EndUtils.getPostgresModule(postgresContainer, postgresConfig)
```

## Benefits of Real Infrastructure Testing

### 🎯 **Catches Real Issues**

- **Database constraint violations** caught before production
- **Query performance problems** identified early
- **Transaction isolation** issues discovered
- **Index behavior** tested with real data

### 🚀 **Confidence in Deployments**

- **Production-like behavior** in tests
- **Infrastructure compatibility** verified
- **Data migration scripts** tested
- **Performance characteristics** measured

### 🔧 **Developer Experience**

- **Easy setup** with single container start
- **Isolated test runs** prevent interference
- **Consistent environments** across team
- **No external dependencies** required

### 🛡️ **Reliability Benefits**

- **No mock maintenance** for infrastructure
- **Real error conditions** tested
- **Actual network timeouts** handled
- **Genuine concurrency** scenarios

Testcontainers transforms testing from **mocked simulations** into **real infrastructure validation**, providing confidence that your code works with actual databases and services in production environments.

let app: INestApplication
let repository: ICatRepository

const containerMongo = new TestMongoContainer()
const containerRedis = new TestRedisContainer()

beforeAll(async () => {
// Configuração do MongoDB com ConnectionName específico
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
        },
        inject: []
      })
      .compile()

    app = moduleRef.createNestApplication()
    repository = app.get(ICatRepository)
    await app.init()

})

it('/GET /v1/cats', async () => {
// Geração automática de mock com Zod
const catMock = new ZodMockSchema(CatEntitySchema)
const input = catMock.generate()
await repository.create(new CatEntity(input))

    return request(app.getHttpServer())
      .get('/cats')
      .set('Authorization', `Bearer ${process.env.TOKEN_TEST}`)
      .expect(200)

})

afterAll(async () => {
await containerMongo.close()
await containerRedis.close()
await app.close()
})
})

````

### User Controller Integration - PostgreSQL + Redis

Testes de integração com PostgreSQL para dados relacionais e Redis para cache:

```typescript
describe('UserController', () => {
  let app: INestApplication

  const postgresContainer = new TestPostgresContainer()
  const redisContainer = new TestRedisContainer()

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRootAsync({
          inject: [TestPostgresContainer],
          useFactory: async (container: TestPostgresContainer) => {
            return await container.getTestPostgres()
          }
        }),
        UserModule
      ],
      providers: [TestPostgresContainer, TestRedisContainer]
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
          const conn = await redisContainer.getTestRedis()
          return conn
        }
      })
      .compile()

    app = moduleRef.createNestApplication()
    await app.init()
  })

  it('/GET /v1/users', async () => {
    return request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${process.env.TOKEN_TEST}`)
      .expect(200)
  })

  afterAll(async () => {
    await postgresContainer.close()
    await redisContainer.close()
    await app.close()
  })
})
````

### Padrões de Implementação

#### 1. **NestJS Testing Module Override**

- Override de providers com instâncias reais dos containers
- Configuração TypeORM dinâmica com PostgreSQL
- Mongoose connection override para MongoDB
- Redis service injection para cache

#### 2. **Cleanup Pattern**

- `afterAll` sempre fecha todos os containers
- Ordem específica: database → cache → app
- Evita vazamento de recursos entre testes

#### 3. **Integration com Mocking**

- `ZodMockSchema` para geração de dados de teste
- Combinação de infraestrutura real + dados mock
- Testes realistas sem setup manual de dados

Esta implementação garante **testes confiáveis** que validam tanto a **lógica de negócio** quanto a **integração com infraestrutura real**, eliminando a necessidade de mocks complexos e aumentando a confiança nos deployments.
