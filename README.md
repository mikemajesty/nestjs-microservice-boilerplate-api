<div align="center">
  <h1>🚀 NestJS Microservice Boilerplate API</h1>
  <p><strong>Enterprise-grade, production-ready NestJS boilerplate with modern architecture patterns</strong></p>

  [![Node.js Version][node-image]][node-url]
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue.svg?style=flat-square)](https://www.typescriptlang.org/)
  [![NestJS](https://img.shields.io/badge/NestJS-11.x-E0234E.svg?style=flat-square&logo=nestjs)](https://nestjs.com/)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

  [node-image]: https://img.shields.io/badge/node.js-%3E=_22.0.0-green.svg?style=flat-square
  [node-url]: http://nodejs.org/download/

  <h3>Code Coverage</h3>

  | Statements | Branches | Functions | Lines |
  |------------|----------|-----------|-------|
  | ![Statements](https://img.shields.io/badge/statements-100%25-brightgreen.svg?style=flat-square) | ![Branches](https://img.shields.io/badge/branches-100%25-brightgreen.svg?style=flat-square) | ![Functions](https://img.shields.io/badge/functions-100%25-brightgreen.svg?style=flat-square) | ![Lines](https://img.shields.io/badge/lines-100%25-brightgreen.svg?style=flat-square) |
</div>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Key Features](#-key-features)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Running the Application](#-running-the-application)
- [Database Migrations](#-database-migrations)
- [CRUD Scaffolding](#-crud-scaffolding)
- [Testing](#-testing)
- [API Documentation](#-api-documentation)
- [Observability](#-observability)
- [Code Quality](#-code-quality)
- [Project Structure](#-project-structure)
- [Advanced Usage](#-advanced-usage)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

This boilerplate provides a **production-ready foundation** for building scalable microservices with NestJS. It implements industry-standard architecture patterns including **Onion Architecture**, **Domain-Driven Design (DDD)**, and **Ports and Adapters (Hexagonal Architecture)**.

Built with enterprise needs in mind, it offers comprehensive features for authentication, authorization, multi-database support, observability, and automated CRUD generation - allowing teams to focus on business logic rather than infrastructure.

## 🏗️ Architecture

This project follows **Clean Architecture** principles with a focus on maintainability, testability, and scalability.

### Architectural Patterns

#### 1. **Onion Architecture**
The codebase is organized in concentric layers where dependencies point inward:
- **Core Layer**: Contains business entities, use cases, and repository interfaces
- **Infrastructure Layer**: Implements external concerns (databases, cache, HTTP clients)
- **Application Layer**: Modules that wire everything together
- **Presentation Layer**: Controllers and API adapters

![Onion Architecture Diagram](OnionGraph.jpg)

#### 2. **Domain-Driven Design (DDD)**
- **Entities**: Business objects with identity (`src/core/*/entity`)
- **Use Cases**: Application-specific business rules (`src/core/*/use-cases`)
- **Repository Pattern**: Abstract data access (`src/core/*/repository`)
- **Value Objects**: Validated domain primitives

#### 3. **Ports and Adapters (Hexagonal)**
- **Ports**: Abstract interfaces defining contracts
- **Adapters**: Concrete implementations for external systems
- **Dependency Inversion**: Core logic independent of frameworks

### Layer Responsibilities

```
┌─────────────────────────────────────────┐
│         Controllers (Modules)           │  ← HTTP/API Layer
├─────────────────────────────────────────┤
│         Use Cases (Core)                │  ← Business Logic
├─────────────────────────────────────────┤
│     Entities & Repositories (Core)      │  ← Domain Layer
├─────────────────────────────────────────┤
│    Infrastructure (DB, Cache, HTTP)     │  ← External Services
└─────────────────────────────────────────┘
```

### User Flow Example

![User Diagram](diagram.png)

---

## ✨ Key Features

### 🔐 Authentication & Authorization

- **JWT-based Authentication**
  - Login/Logout endpoints
  - Access token generation
  - Refresh token mechanism
  - Token blacklisting on logout
  
- **Password Management**
  - Secure password hashing
  - Password change functionality
  - Forgot password flow with email
  - Reset password with token validation

- **Role-Based Access Control (RBAC)**
  - Dynamic role assignment
  - Granular permission system
  - Endpoint-level authorization
  - Permission inheritance

### 💾 Multi-Database Support

#### PostgreSQL (TypeORM)
- Relational data modeling
- Complex queries and joins
- Transaction support
- Migration system
- Soft delete functionality

#### MongoDB (Mongoose)
- Document-based storage
- Flexible schema design
- Built-in pagination
- Text search capabilities
- Migration support

### 🚀 CRUD Scaffolding

Automatically generate complete CRUD operations in seconds:
- Entity generation with validation
- Use cases (Create, Read, Update, Delete, List)
- Repository implementation
- Controller with routes
- Swagger documentation
- Unit tests (100% coverage)
- Input/Output DTOs

### 📊 Observability Stack

#### Distributed Tracing
- **OpenTelemetry** integration
- Zipkins for trace visualization
- HTTP request tracing
- Database query tracing
- Inter-service call tracking
- Custom span creation

#### Logging
- **Pino** high-performance logger
- Structured JSON logging
- Request/Response logging
- Error tracking with stack traces
- Log aggregation with Loki
- Configurable log levels

#### Metrics
- Request duration
- HTTP status codes
- Database query performance
- Cache hit/miss ratio
- Custom business metrics
- Prometheus-compatible format

#### Health Checks
- Database connectivity
- Cache availability
- Memory usage
- CPU metrics
- Custom health indicators

### 🔄 Resilience Patterns

- **Circuit Breaker** (Opossum)
  - Automatic failure detection
  - Fallback mechanisms
  - Configurable thresholds
  - Service degradation

- **Retry Logic**
  - Exponential backoff
  - Configurable retry policies
  - Request timeout handling

### 🌍 Internationalization (i18n)

- Multi-language support
- Dynamic language switching
- Validation message translation
- API response localization
- Supported languages: English, Portuguese

### 📦 Caching Strategies

- **Redis** for distributed caching
- **NodeCache** for in-memory caching
- TTL configuration
- Cache invalidation
- Cache-aside pattern

### 🛡️ Security Features

- Helmet.js for HTTP headers
- CORS configuration
- Request rate limiting
- Input validation with Zod
- SQL injection prevention
- XSS protection
- CSRF protection ready

### 📧 Email System

- Handlebars templates
- Welcome emails
- Password reset emails
- SMTP configuration
- HTML/Plain text support

---

## 🛠️ Tech Stack

### Core Framework
- **NestJS** 11.x - Progressive Node.js framework
- **TypeScript** 5.9.3 - Type-safe development
- **Node.js** 22.x - Runtime environment

### Databases & ORMs
- **PostgreSQL** with TypeORM - Relational database
- **MongoDB** with Mongoose - Document database
- **Redis** - Caching and sessions

### Observability
- **OpenTelemetry** - Distributed tracing
- **Pino** - High-performance logging
- **Zipkins** - Trace visualization
- **Prometheus** - Metrics collection

### Testing
- **Jest** - Testing framework
- **Supertest** - HTTP assertions
- **Testcontainers** - Integration testing with Docker

### Code Quality
- **ESLint** - Linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **Commitlint** - Commit message linting
- **Lint-staged** - Staged files linting

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **PM2** - Process management
- **Artillery** - Load testing

### Additional Libraries
- **Zod** - Schema validation
- **Axios** - HTTP client
- **JWT** - Token management
- **Nodemailer** - Email sending
- **Swagger** - API documentation

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 22.0.0 ([Download](https://nodejs.org/))
- **npm** >= 9.x or **yarn** >= 1.22.x
- **Docker** >= 20.x ([Download](https://www.docker.com/))
- **Docker Compose** >= 2.x
- **NVM** (Node Version Manager) - Recommended

### System Requirements

- **OS**: Linux, macOS, or Windows (with WSL2)
- **Memory**: Minimum 4GB RAM (8GB recommended)
- **Disk Space**: 2GB free space

---

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/mikemajesty/nestjs-microservice-boilerplate-api.git
cd nestjs-microservice-boilerplate-api
```

### 2. Install Node Version

```bash
# Install the required Node.js version
nvm install

# Use the installed version
nvm use
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Setup Infrastructure

Start all required services (PostgreSQL, MongoDB, Redis, Zipkins, etc.):

```bash
npm run setup
```

This command will:
- Stop and remove existing containers
- Clean up volumes
- Start fresh containers for all services
- Wait for services to be ready

### 5. Run Migrations

Migrations run automatically on application start, but you can run them manually:

```bash
# Run all migrations
npm run migration:run
```

### 6. Start the Application

```bash
# Development mode with hot-reload
npm run start:dev

# Debug mode
npm run start:debug

# Production mode
npm run start
```

The API will be available at: `http://localhost:4000`

### 7. Access Swagger Documentation

Open your browser and navigate to:
```
http://localhost:4000/api/docs
```

### 8. Test the API

Login with default credentials:

```bash
curl -X 'POST' \
  'http://localhost:4000/api/v1/login' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "admin@admin.com",
    "password": "admin"
  }'
```
### Configuration Files

- **`nest-cli.json`** - NestJS CLI configuration
- **`tsconfig.json`** - TypeScript compiler options
- **`jest.config.ts`** - Testing configuration
- **`eslint.config.mjs`** - Linting rules
- **`.prettierrc`** - Code formatting rules
- **`docker-compose-infra.yml`** - Infrastructure services

---

## 🏃 Running the Application

### Development Mode

Hot-reload enabled for rapid development:

```bash
npm run start:dev
```

### Debug Mode

Attach a debugger to inspect and debug:

```bash
npm run start:debug
```

Then attach your IDE debugger to port `9229`.

### Production Mode

Optimized build for production:

```bash
# Build the application
npm run build

# Start production server
npm run start
```

### Using Docker

Run the entire application stack with Docker Compose:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f microservice-api

# Stop services
docker-compose down
```

### Using PM2 (Production)

PM2 provides process management and monitoring:

```bash
# Start with PM2
npm run start

# Monitor processes
pm2 monit

# View logs
pm2 logs

# Restart application
pm2 restart ecosystem.config.js

# Stop application
pm2 stop ecosystem.config.js
```

---

## 🗄️ Database Migrations

### PostgreSQL Migrations

#### Create a New Migration

```bash
npm run migration-postgres:create
```

This creates a new migration file in `src/infra/database/postgres/migrations/`.

#### Run Migrations

```bash
npm run migration-postgres:run
```

#### Revert Last Migration

```bash
npm run migration-postgres:undo
```

### MongoDB Migrations

#### Create a New Migration

```bash
npm run migration-mongo:create
```

Provide a name when prompted (e.g., `createUsersCollection`).

#### Run Migrations

```bash
npm run migration-mongo:run
```

#### Revert Last Migration

```bash
npm run migration-mongo:undo
```

### Run All Migrations

Run both PostgreSQL and MongoDB migrations concurrently:

```bash
npm run migration:run
```

---

## 🎨 CRUD Scaffolding

Generate a complete, production-ready CRUD module in seconds!

### Usage

```bash
npm run scaffold
```

### Interactive Prompts

1. **Choose Database**
   - `POSTGRES:CRUD` - Generate CRUD for PostgreSQL
   - `MONGO:CRUD` - Generate CRUD for MongoDB
   - `LIB` - Generate a library module
   - `INFRA` - Generate infrastructure component
   - `MODULE` - Generate a custom module
   - `CORE` - Generate core domain logic

2. **Enter Module Name**
   - Use singular form (e.g., `product`, `order`, `customer`)
   - Follow camelCase or kebab-case naming

### What Gets Generated

For a module named `product`:

```
src/
├── core/
│   └── product/
│       ├── entity/
│       │   └── product.ts                    # Domain entity with validation
│       ├── repository/
│       │   └── product.ts                    # Repository interface
│       └── use-cases/
│           ├── product-create.ts             # Create use case
│           ├── product-update.ts             # Update use case
│           ├── product-delete.ts             # Delete use case (soft)
│           ├── product-get-by-id.ts          # Find by ID use case
│           ├── product-list.ts               # List with pagination/search
│           └── __tests__/                    # Unit tests (100% coverage)
│               ├── product-create.spec.ts
│               ├── product-update.spec.ts
│               ├── product-delete.spec.ts
│               ├── product-get-by-id.spec.ts
│               └── product-list.spec.ts
├── modules/
│   └── product/
│       ├── adapter.ts                        # Use case adapters
│       ├── controller.ts                     # REST controller
│       ├── module.ts                         # NestJS module
│       ├── repository.ts                     # Repository implementation
│       └── swagger.ts                        # API documentation
└── infra/
    └── database/
        └── [postgres|mongo]/
            └── schemas/
                └── product.ts                # Database schema
```

### Generated Features

Each CRUD module includes:

✅ **Entity Validation** - Zod schemas for type-safe validation  
✅ **Pagination** - Offset/limit based pagination  
✅ **Search** - Full-text search capabilities  
✅ **Sorting** - Multi-field sorting  
✅ **Soft Delete** - Logical deletion with `deletedAt`  
✅ **Filtering** - Dynamic query filters  
✅ **Swagger Docs** - Auto-generated API documentation  
✅ **Unit Tests** - 100% test coverage  
✅ **Type Safety** - Full TypeScript support  
✅ **Error Handling** - Consistent error responses  

### Example

After generation, follow the instructions in the CLI output to:
1. Import the module in `app.module.ts`
2. Run migrations if database schema was created
3. Access the new endpoints in Swagger

<img loading="lazy" src="ohmy.gif" width="150" height="150"/>

---



## 🧪 Testing

This project maintains **100% code coverage** with comprehensive test suites.

### Test Structure

```
test/
├── initialization.ts           # Global test setup
└── **/*.spec.ts               # Unit tests

src/
└── core/
    └── */use-cases/__tests__/  # Use case tests
```

### Running Tests

#### Run All Tests

```bash
npm run test
```

#### Run Tests with Coverage

```bash
npm run test:cov
```

Coverage reports are generated in:
- `coverage/` - HTML report
- `coverage/lcov.info` - LCOV format
- Badges automatically updated in README

#### Debug Tests

```bash
npm run test:debug
```

Then attach your debugger to the Node process.

#### Watch Mode

```bash
npm run test -- --watch
```

### Test Types

#### Unit Tests
- **Use Case Tests**: Business logic validation
- **Entity Tests**: Domain model validation
- **Service Tests**: Infrastructure service testing

#### Integration Tests
- **API Tests**: End-to-end API testing with Supertest
- **Database Tests**: Using Testcontainers for real databases
- **Cache Tests**: Redis integration testing

### Test Utilities

Located in `src/utils/tests.ts`:
- Mock factories
- Test data generators
- Common assertions
- Setup/teardown helpers

### Testcontainers

Automatically spins up isolated Docker containers for integration tests:
- PostgreSQL container
- MongoDB container
- Redis container

Ensures tests run in isolation with clean state.

### Writing Tests

Example use case test:

```typescript
describe('ProductCreateUseCase', () => {
  let useCase: ProductCreateUseCase;
  let repository: jest.Mocked<IProductRepository>;

  beforeEach(() => {
    repository = createMockRepository();
    useCase = new ProductCreateUseCase(repository);
  });

  it('should create a product successfully', async () => {
    const input = { name: 'Test Product', price: 99.99 };
    const result = await useCase.execute(input);
    
    expect(result).toMatchObject(input);
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining(input)
    );
  });
});
```

### Code Coverage Badges

Coverage badges are automatically generated and updated in the README after running `npm run test:cov`.

---

## 📚 API Documentation

### Swagger/OpenAPI

Interactive API documentation is available via Swagger UI.

#### Access Swagger UI

```
http://localhost:4000/api/docs
```

#### OpenAPI Specification

Download the OpenAPI spec:

```
http://localhost:4000/api/docs-json
```

### API Endpoints Overview

#### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/login` | User login |
| POST | `/api/v1/logout` | User logout |
| POST | `/api/v1/refresh-token` | Refresh access token |
| POST | `/api/v1/forgot-password` | Request password reset |
| POST | `/api/v1/reset-password` | Reset password with token |

#### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/users` | List users (paginated) |
| GET | `/api/v1/users/:id` | Get user by ID |
| POST | `/api/v1/users` | Create new user |
| PUT | `/api/v1/users/:id` | Update user |
| DELETE | `/api/v1/users/:id` | Delete user (soft) |
| PATCH | `/api/v1/users/:id/password` | Change password |

#### Roles

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/roles` | List roles |
| GET | `/api/v1/roles/:id` | Get role by ID |
| POST | `/api/v1/roles` | Create role |
| PUT | `/api/v1/roles/:id` | Update role |
| DELETE | `/api/v1/roles/:id` | Delete role |
| POST | `/api/v1/roles/:id/permissions` | Add permission to role |
| DELETE | `/api/v1/roles/:id/permissions/:permissionId` | Remove permission |

#### Permissions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/permissions` | List permissions |
| GET | `/api/v1/permissions/:id` | Get permission by ID |
| POST | `/api/v1/permissions` | Create permission |
| PUT | `/api/v1/permissions/:id` | Update permission |
| DELETE | `/api/v1/permissions/:id` | Delete permission |

#### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Application health check |
| GET | `/health/database` | Database connectivity |
| GET | `/health/cache` | Cache availability |

### Request Examples

#### List Users with Pagination

```bash
curl -X 'GET' \
  'http://localhost:4000/api/v1/users?limit=10&offset=0&sort=createdAt:desc' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

#### Create a User

```bash
curl -X 'POST' \
  'http://localhost:4000/api/v1/users' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securePassword123",
    "roles": ["user"]
  }'
```

#### Search Users

```bash
curl -X 'GET' \
  'http://localhost:4000/api/v1/users?search=john&limit=10' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

### Response Format

#### Success Response

```json
{
  "data": { ... },
  "metadata": {
    "timestamp": "2024-12-08T00:00:00.000Z",
    "path": "/api/v1/users",
    "version": "1.0.0"
  }
}
```

#### Error Response

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ],
  "timestamp": "2024-12-08T00:00:00.000Z",
  "path": "/api/v1/users"
}
```

### Swagger Decorators

Document your endpoints with Swagger decorators:

```typescript
@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  @Get()
  @ApiOperation({ summary: 'List all users' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async list(@Query() query: ListQueryDTO) {
    // ...
  }
}
```

---

## 📊 Observability

### Distributed Tracing

#### Zipkins UI

Access Zipkins for distributed tracing:

```
http://localhost:16686
```

#### Tracing Features

- **Automatic Instrumentation**: HTTP requests, database queries
- **Custom Spans**: Create application-specific spans
- **Context Propagation**: Trace requests across services
- **Performance Analysis**: Identify bottlenecks

#### Using Tracing in Code

See [TRACING.md](TRACING.md) for detailed documentation.

Basic example:

```typescript
// In your use case
async execute(input: Input, httpService: IHttpAdapter): Promise<Output> {
  const http = httpService.instance();
  const span = httpService.tracing.createSpan('external-api-call');
  
  try {
    span.setTag(httpService.tracing.tags.PEER_SERVICE, 'external-api');
    const result = await http.get('https://api.example.com/data');
    span.finish();
    return result;
  } catch (error) {
    span.setTag(httpService.tracing.tags.ERROR, true);
    span.setTag('message', error.message);
    span.finish();
    throw error;
  }
}
```

### Logging

#### Log Levels

- **fatal**: System is unusable
- **error**: Error events
- **warn**: Warning messages
- **info**: Informational messages
- **debug**: Debug messages
- **trace**: Very detailed trace messages

#### Structured Logging

All logs are JSON-formatted for easy parsing:

```json
{
  "level": "info",
  "time": 1702000000000,
  "msg": "User created",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "correlationId": "abc-def-ghi",
  "service": "microservice-api"
}
```

#### Request Logging

Automatic logging of all HTTP requests:
- Request method and URL
- Request headers
- Request body
- Response status
- Response time
- User information

#### Viewing Logs

```bash
# Application logs
tail -f logs/app.log

# Error logs only
tail -f logs/error.log

# With PM2
pm2 logs microservice-api

# With Docker
docker-compose logs -f microservice-api
```

### Metrics

Metrics are exposed in Prometheus format:

```
http://localhost:4000/metrics
```

#### Available Metrics

- **HTTP Metrics**
  - Request count
  - Request duration (histogram)
  - Response status codes
  - Active requests

- **Database Metrics**
  - Query count
  - Query duration
  - Connection pool status

- **Cache Metrics**
  - Hit/miss ratio
  - Cache size
  - Eviction count

- **Application Metrics**
  - Memory usage
  - CPU usage
  - Event loop lag

### Health Checks

#### Liveness Probe

```bash
curl http://localhost:4000/health
```

Response:
```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "cache": { "status": "up" }
  },
  "details": {
    "database": { "status": "up" },
    "cache": { "status": "up" }
  }
}
```

#### Readiness Probe

Checks if the application is ready to receive traffic:
- Database connectivity
- Cache availability
- Required migrations applied

---

## 🎯 Code Quality

### Linting

#### Run Linter

```bash
npm run lint
```

#### Auto-fix Issues

```bash
npm run lint -- --fix
```

#### ESLint Configuration

Located in `eslint.config.mjs`:
- TypeScript rules
- NestJS best practices
- Security rules
- Import sorting
- No lodash/underscore (prefer native JS)

### Code Formatting

#### Format Code

```bash
npm run prettier
```

#### Prettier Configuration

Located in `.prettierrc`:
- Single quotes
- No semicolons
- 100 character line width
- 2 space indentation

### Git Hooks

#### Pre-commit Hook (Husky)

Automatically runs on `git commit`:
- Lints staged files
- Runs type checking
- Validates commit message format

#### Lint-staged

Only lints files staged for commit:

```json
{
  "*.{ts,js}": ["eslint --fix"],
  "*.json": ["prettier --write"]
}
```

### Commit Message Convention

Follows [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `build`: Build system changes
- `ci`: CI/CD changes
- `chore`: Other changes

#### Examples

```bash
feat(user): add email verification

fix(auth): resolve token refresh issue

docs: update API documentation

test(user): add unit tests for user creation
```

### Continuous Integration

#### Semantic Release

Automatic versioning and changelog generation based on commit messages:
- Analyzes commits
- Determines version bump (major/minor/patch)
- Generates changelog
- Creates GitHub release
- Publishes to npm (if configured)

---

## 📁 Project Structure

```
nestjs-microservice-boilerplate-api/
├── .artillery/                 # Load testing configuration
├── .docker/                    # Docker-related files
├── .github/                    # GitHub Actions workflows
├── .husky/                     # Git hooks
├── .vscode/                    # VS Code settings
├── docs/                       # Additional documentation
├── scripts/                    # Utility scripts
├── src/
│   ├── core/                   # 🎯 Business Logic Layer
│   │   ├── cat/                # Example domain: Cat
│   │   │   ├── entity/         # Domain entities
│   │   │   │   └── cat.ts
│   │   │   ├── repository/     # Repository interfaces
│   │   │   │   └── cat.ts
│   │   │   └── use-cases/      # Business use cases
│   │   │       ├── cat-create.ts
│   │   │       ├── cat-update.ts
│   │   │       ├── cat-delete.ts
│   │   │       ├── cat-get-by-id.ts
│   │   │       ├── cat-list.ts
│   │   │       └── __tests__/  # Use case tests
│   │   ├── user/               # User domain
│   │   ├── role/               # Role domain
│   │   ├── permission/         # Permission domain
│   │   └── reset-password/     # Password reset domain
│   │
│   ├── infra/                  # 🔧 Infrastructure Layer
│   │   ├── database/           # Database implementations
│   │   │   ├── mongo/          # MongoDB setup
│   │   │   │   ├── config.ts
│   │   │   │   ├── migrations/
│   │   │   │   ├── schemas/
│   │   │   │   └── service.ts
│   │   │   └── postgres/       # PostgreSQL setup
│   │   │       ├── config.ts
│   │   │       ├── migrations/
│   │   │       ├── schemas/
│   │   │       └── service.ts
│   │   ├── cache/              # Cache implementations
│   │   │   ├── redis/
│   │   │   └── memory/
│   │   ├── http/               # HTTP client service
│   │   ├── email/              # Email service
│   │   │   ├── service.ts
│   │   │   └── templates/      # Email templates
│   │   ├── logger/             # Logging service
│   │   ├── secrets/            # Secrets management
│   │   └── repository/         # Generic repository implementations
│   │
│   ├── libs/                   # 📚 Shared Libraries
│   │   ├── token/              # JWT token service
│   │   ├── event/              # Event emitter
│   │   └── i18n/               # Internationalization
│   │       ├── languages/
│   │       │   ├── en/
│   │       │   └── pt/
│   │       └── service.ts
│   │
│   ├── modules/                # 🚀 Application Modules
│   │   ├── cat/                # Cat module
│   │   │   ├── adapter.ts      # Use case adapters
│   │   │   ├── controller.ts   # REST controller
│   │   │   ├── module.ts       # NestJS module
│   │   │   ├── repository.ts   # Repository implementation
│   │   │   └── swagger.ts      # Swagger documentation
│   │   ├── user/               # User module
│   │   ├── role/               # Role module
│   │   ├── permission/         # Permission module
│   │   ├── login/              # Login module
│   │   ├── logout/             # Logout module
│   │   ├── reset-password/     # Password reset module
│   │   └── health/             # Health check module
│   │
│   ├── observables/            # 👁️ Cross-cutting Concerns
│   │   ├── filters/            # Exception filters
│   │   │   └── http-exception.filter.ts
│   │   ├── guards/             # Route guards
│   │   │   └── auth.guard.ts
│   │   ├── interceptors/       # Request/Response interceptors
│   │   │   ├── http-logger.interceptor.ts
│   │   │   ├── tracing.interceptor.ts
│   │   │   ├── metrics.interceptor.ts
│   │   │   └── request-timeout.interceptor.ts
│   │   └── middlewares/        # Express middlewares
│   │       └── authentication.middleware.ts
│   │
│   ├── utils/                  # 🛠️ Utility Functions
│   │   ├── decorators/         # Custom decorators
│   │   │   ├── role.decorator.ts
│   │   │   ├── validate-schema.decorator.ts
│   │   │   └── request-timeout.decorator.ts
│   │   ├── docs/               # Documentation utilities
│   │   │   ├── swagger.ts
│   │   │   └── data/           # Swagger example data
│   │   ├── entity.ts           # Base entity class
│   │   ├── exception.ts        # Custom exceptions
│   │   ├── pagination.ts       # Pagination utilities
│   │   ├── search.ts           # Search utilities
│   │   ├── sort.ts             # Sort utilities
│   │   ├── tracing.ts          # Tracing utilities
│   │   ├── tests.ts            # Test utilities
│   │   └── validator.ts        # Zod validation helpers
│   │
│   ├── app.module.ts           # Root application module
│   └── main.ts                 # Application entry point
│
├── test/                       # 🧪 Test Configuration
│   └── initialization.ts       # Global test setup
├── .env                        # Environment variables
├── .nvmrc                      # Node version
├── commitlint.config.js        # Commit lint configuration
├── docker-compose.yml          # Main docker compose
├── docker-compose-infra.yml    # Infrastructure services
├── Dockerfile                  # Application dockerfile
├── ecosystem.config.js         # PM2 configuration
├── eslint.config.mjs           # ESLint configuration
├── jest.config.ts              # Jest configuration
├── nest-cli.json               # NestJS CLI configuration
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
└── README.md                   # This file
```

### Layer Descriptions

#### Core Layer (`src/core/`)
Contains the business logic, independent of frameworks and external services. Includes:
- **Entities**: Domain models with business rules
- **Use Cases**: Application-specific business operations
- **Repository Interfaces**: Abstract data access contracts

#### Infrastructure Layer (`src/infra/`)
Implements external concerns and technical details:
- Database connections and schemas
- Third-party API clients
- Caching mechanisms
- Email services
- Logging infrastructure

#### Libraries Layer (`src/libs/`)
Reusable, framework-agnostic libraries:
- Token management
- Event handling
- Internationalization

#### Modules Layer (`src/modules/`)
NestJS modules that wire everything together:
- Controllers for HTTP endpoints
- Dependency injection configuration
- Route definitions
- Swagger documentation

#### Observables Layer (`src/observables/`)
Cross-cutting concerns applied to the entire application:
- Authentication and authorization
- Request/response logging
- Error handling
- Performance monitoring

---

## 🚀 Advanced Usage

### Custom Decorators

#### Role-Based Authorization

```typescript
import { Roles } from '@/utils/decorators';

@Controller('admin')
export class AdminController {
  @Get('users')
  @Roles('admin', 'superadmin')
  async listUsers() {
    // Only accessible by admin and superadmin roles
  }
}
```

#### Request Timeout

```typescript
import { RequestTimeout } from '@/utils/decorators';

@Controller('data')
export class DataController {
  @Get('export')
  @RequestTimeout(60000) // 60 seconds
  async exportLargeDataset() {
    // Long-running operation
  }
}
```

#### Schema Validation

```typescript
import { ValidateSchema } from '@/utils/decorators';
import { z } from 'zod';

const CreateProductSchema = z.object({
  name: z.string().min(1).max(200),
  price: z.number().positive(),
  description: z.string().optional()
});

@Controller('products')
export class ProductController {
  @Post()
  @ValidateSchema(CreateProductSchema)
  async create(@Body() data: z.infer<typeof CreateProductSchema>) {
    // Data is validated and type-safe
  }
}
```

### Circuit Breaker Pattern

Protect your services from cascading failures:

```typescript
import CircuitBreaker from 'opossum';

const options = {
  timeout: 3000, // If function takes longer than 3 seconds, trigger a failure
  errorThresholdPercentage: 50, // Open circuit if 50% of requests fail
  resetTimeout: 30000 // Try again after 30 seconds
};

const breaker = new CircuitBreaker(asyncFunction, options);

breaker.fire()
  .then(result => console.log(result))
  .catch(err => console.error(err));
```

### Event-Driven Architecture

Use the event emitter for decoupled communication:

```typescript
// Emit an event
this.eventEmitter.emit('user.created', {
  userId: user.id,
  email: user.email
});

// Listen to an event
@OnEvent('user.created')
handleUserCreated(payload: { userId: string; email: string }) {
  // Send welcome email
  this.emailService.sendWelcome(payload.email);
}
```

### Load Testing

Run load tests with Artillery:

```bash
npm run test:load
```

Configure tests in `.artillery/config.yaml`.

### Database Connection Pooling

PostgreSQL pool configuration:

```typescript
// In postgres config
{
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT),
  poolSize: 20,
  maxQueryExecutionTime: 1000,
  extra: {
    max: 20, // Maximum pool size
    min: 5,  // Minimum pool size
    idleTimeoutMillis: 30000
  }
}
```

### Caching Strategies

#### Cache-Aside Pattern

```typescript
async getUser(id: string): Promise<User> {
  // Try cache first
  const cached = await this.cache.get(`user:${id}`);
  if (cached) return cached;

  // Cache miss - fetch from database
  const user = await this.repository.findById(id);
  
  // Update cache
  await this.cache.set(`user:${id}`, user, 3600);
  
  return user;
}
```

#### Cache Invalidation

```typescript
async updateUser(id: string, data: UpdateUserDTO): Promise<User> {
  const user = await this.repository.update(id, data);
  
  // Invalidate cache
  await this.cache.del(`user:${id}`);
  
  return user;
}
```

### Secrets Management

Access secrets securely:

```typescript
import { ISecretsAdapter } from '@/infra/secrets';

constructor(private readonly secrets: ISecretsAdapter) {}

async someMethod() {
  const apiKey = await this.secrets.get('EXTERNAL_API_KEY');
  // Use the secret
}
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

### Getting Started

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm run test`
5. Run linter: `npm run lint`
6. Commit your changes: `git commit -m 'feat: add amazing feature'`
7. Push to the branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

### Commit Message Guidelines

Follow [Conventional Commits](https://www.conventionalcommits.org/):
- Use `feat:` for new features
- Use `fix:` for bug fixes
- Use `docs:` for documentation
- Use `test:` for tests
- Use `refactor:` for code refactoring

### Code Style

- Follow the existing code style
- Use TypeScript strict mode
- Write unit tests for new features
- Update documentation as needed
- Maintain 100% test coverage

### Pull Request Process

1. Update the README.md with details of changes if applicable
2. Update the CHANGELOG.md following Keep a Changelog format
3. Ensure all tests pass
4. Request review from maintainers
5. Squash commits before merging

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](https://opensource.org/licenses/MIT) file for details.

### MIT License Summary

```
Copyright (c) 2024

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 👥 Contributors

Thanks to all contributors who have helped make this project better!

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/mikemajesty">
        <img src="https://avatars1.githubusercontent.com/u/11630212?s=460&v=4" width="100px;" alt="Mike Lima"/>
        <br />
        <sub><b>Mike Lima</b></sub>
      </a>
      <br />
      <a href="https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/commits?author=mikemajesty" title="Code">💻</a>
      <a href="#maintenance-mikemajesty" title="Maintenance">🚧</a>
    </td>
  </tr>
</table>

---

## 📞 Support

- **Documentation**: [docs/README.md](docs/README.md)
- **Issues**: [GitHub Issues](https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/issues)
- **Discussions**: [GitHub Discussions](https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/discussions)

---

## 🎓 Resources

### Architecture Patterns
- [Onion Architecture](https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)

### NestJS
- [Official Documentation](https://docs.nestjs.com/)
- [NestJS Recipes](https://docs.nestjs.com/recipes/sql-typeorm)
- [NestJS Best Practices](https://github.com/nestjs/nest/tree/master/sample)

### Observability
- [OpenTelemetry](https://opentelemetry.io/)
- [Zipkins Tracing](https://www.Zipkinstracing.io/)
- [Prometheus](https://prometheus.io/)

---

<div align="center">
  <strong>⭐ If you find this project useful, please consider giving it a star! ⭐</strong>
  <br><br>
  <sub>Built with ❤️ by <a href="https://github.com/mikemajesty">Mike Lima</a></sub>
</div>
