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
import { TestMongoContainer } from '@/utils/test/containers'

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
    await userRepository.save(new UserEntity({
      id: '1', name: 'João Silva', email: 'joao@example.com'
    }))
    await userRepository.save(new UserEntity({
      id: '2', name: 'Maria Santos', email: 'maria@example.com'
    }))

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
import { TestPostgresContainer } from '@/utils/test/containers'

describe('Order Service Integration', () => {
  let postgresContainer: TestPostgresContainer
  let dataSource: DataSource
  let orderService: OrderService

  beforeAll(async () => {
    postgresContainer = new TestPostgresContainer()
    const container = await postgresContainer.getTestPostgres()
    
    const config = postgresContainer.getConfiguration(container, __dirname)
    dataSource = await postgresContainer.getDataSource(config)
    
    orderService = new OrderService(dataSource)
  })

  afterAll(async () => {
    await dataSource.destroy()
    await postgresContainer.close()
  })

  it('should handle complex order transactions', async () => {
    const orderData = {
      customerId: TestUtils.getMockUUID(),
      items: [
        { productId: 'prod-1', quantity: 2, price: 99.99 },
        { productId: 'prod-2', quantity: 1, price: 149.99 }
      ],
      total: 349.97
    }

    // Test actual PostgreSQL transaction
    await dataSource.transaction(async (manager) => {
      const order = await orderService.create(orderData, manager)
      const inventory = await orderService.updateInventory(order.items, manager)
      
      expect(order.id).toBeDefined()
      expect(order.status).toBe('pending')
      expect(inventory.updated).toBe(true)
    })
  })

  it('should enforce foreign key constraints', async () => {
    const invalidOrder = {
      customerId: 'invalid-customer-id', // Non-existent customer
      items: [],
      total: 0
    }

    // Test actual database constraints
    await expect(orderService.create(invalidOrder))
      .rejects.toThrow(/foreign key constraint/)
  })
})
```

### Redis Container

Perfect for testing caching, session management, and real-time features:

```typescript
import { TestRedisContainer } from '@/utils/test/containers'

describe('Cache Service Integration', () => {
  let redisContainer: TestRedisContainer
  let cacheService: CacheService

  beforeAll(async () => {
    redisContainer = new TestRedisContainer()
    cacheService = await redisContainer.getTestRedis()
  })

  afterAll(async () => {
    await redisContainer.close()
  })

  it('should cache and retrieve complex objects', async () => {
    const cacheKey = 'user:profile:123'
    const userData = {
      id: '123',
      name: 'John Doe',
      preferences: {
        theme: 'dark',
        notifications: true
      },
      lastAccess: new Date()
    }

    // Test actual Redis operations
    await cacheService.set(cacheKey, userData, 3600) // 1 hour TTL
    const cached = await cacheService.get(cacheKey)
    
    expect(cached).toEqual(userData)
    expect(cached.preferences.theme).toBe('dark')
  })

  it('should handle cache expiration', async () => {
    const shortLivedKey = 'temp:data'
    
    await cacheService.set(shortLivedKey, { value: 'test' }, 1) // 1 second TTL
    
    // Immediately available
    expect(await cacheService.get(shortLivedKey)).toBeDefined()
    
    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 1100))
    expect(await cacheService.get(shortLivedKey)).toBeNull()
  })

  it('should handle Redis pub/sub for real-time features', async () => {
    const channel = 'notifications'
    const messages: string[] = []

    // Subscribe to channel
    await cacheService.subscribe(channel, (message) => {
      messages.push(message)
    })

    // Publish messages
    await cacheService.publish(channel, 'User logged in')
    await cacheService.publish(channel, 'New order received')

    // Allow time for message processing
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(messages).toHaveLength(2)
    expect(messages[0]).toBe('User logged in')
    expect(messages[1]).toBe('New order received')
  })
})
```

## End-to-End Testing with Multiple Containers

```typescript
describe('Complete Order Flow E2E', () => {
  let mongoContainer: TestMongoContainer
  let postgresContainer: TestPostgresContainer
  let redisContainer: TestRedisContainer
  let app: INestApplication

  beforeAll(async () => {
    // Start all infrastructure containers
    mongoContainer = new TestMongoContainer()
    postgresContainer = new TestPostgresContainer()
    redisContainer = new TestRedisContainer()

    const { mongoConnection } = await mongoContainer.getTestMongo(ConnectionName.USER)
    const pgContainer = await postgresContainer.getTestPostgres()
    const cacheService = await redisContainer.getTestRedis()

    // Configure test application with real infrastructure
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider('MongoConnection').useValue(mongoConnection)
    .overrideProvider('PostgresConnection').useValue(pgContainer)
    .overrideProvider('CacheService').useValue(cacheService)
    .compile()

    app = moduleRef.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
    await mongoContainer.close()
    await postgresContainer.close()
    await redisContainer.close()
  })

  it('should process complete order with real infrastructure', async () => {
    // 1. Create user in MongoDB
    const userResponse = await request(app.getHttpServer())
      .post('/users')
      .send({
        name: 'John Doe',
        email: 'john@example.com'
      })
      .expect(201)

    // 2. Create order in PostgreSQL
    const orderResponse = await request(app.getHttpServer())
      .post('/orders')
      .send({
        customerId: userResponse.body.data.id,
        items: [
          { productId: 'prod-1', quantity: 2, price: 99.99 }
        ]
      })
      .expect(201)

    // 3. Verify cache was updated in Redis
    const cacheKey = `order:${orderResponse.body.data.id}`
    const cachedOrder = await cacheService.get(cacheKey)
    expect(cachedOrder).toBeDefined()

    // 4. Verify data consistency across all systems
    expect(userResponse.body.data.id).toBeDefined()
    expect(orderResponse.body.data.customerId).toBe(userResponse.body.data.id)
    expect(cachedOrder.id).toBe(orderResponse.body.data.id)
  })
})
```

## Configuration Management

### Environment Variables

Containers automatically use environment variables for database names:

```typescript
// Required environment variables
MONGO_DATABASE=test_app_db
POSTGRES_DATABASE=test_app_db

// Containers use these for consistent naming
const mongoContainer = new TestMongoContainer()
// Uses MONGO_DATABASE for database name

const postgresContainer = new TestPostgresContainer() 
// Uses POSTGRES_DATABASE for database name
```

### Path Configuration for PostgreSQL

```typescript
// Automatically loads migrations and entities
const config = postgresContainer.getConfiguration(container, __dirname)

// Includes:
// - Migrations: ../../../infra/database/postgres/migrations/
// - Entities: ../../../infra/database/postgres/schemas/
// - Naming strategy: SnakeNamingStrategy
// - Auto-run migrations: true
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

---

## Implementação Real no Projeto

### Cat Controller E2E - MongoDB + Redis

Testes end-to-end com MongoDB para persistência de documentos e Redis para cache:

```typescript
describe('CatController', () => {
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
```

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
```

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