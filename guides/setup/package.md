# Package Scripts Reference

Complete reference for all npm scripts available in this project.

## Quick Reference

| Command | Purpose |
|---------|---------|
| `npm run start` | Production start with PM2 |
| `npm run start:dev` | Development with hot-reload |
| `npm run test` | Run unit tests |
| `npm run setup` | Setup infrastructure (Docker) |
| `npm run docker:build` | Build Docker image |
| `npm run docker:run` | Run Docker container |
| `npm run docker:stop` | Stop Docker container |
| `npm run docker:start` | Stop + Build + Run (all-in-one) |
| `npm run scaffold` | Generate CRUD module |

---

## 🚀 Application Scripts

### Start Production

```bash
npm run start
```

**What it does:**
1. Runs all database migrations (`migration:run`)
2. Starts the application with **PM2** process manager

PM2 provides:
- **Process management** (auto-restart on crash)
- **Cluster mode** (multiple instances)
- **Zero-downtime deploys**
- **Log management**

Configuration: [ecosystem.config.js](../ecosystem.config.js)

---

### Start Development

```bash
npm run start:dev
```

**What it does:**
1. Runs all database migrations
2. Type-checks with `tsc --noEmit` (no output, just validation)
3. Starts NestJS in **watch mode** with **SWC** compiler

**Why SWC?**
- 20x faster than TypeScript compiler
- Hot-reload on file changes
- Better developer experience

---

### Start Debug

```bash
npm run start:debug
```

**What it does:**
1. Runs all database migrations
2. Type-checks with `tsc --noEmit`
3. Starts NestJS in **debug mode** with watch

**Usage with VS Code:**
1. Run the command
2. Attach VS Code debugger to port `9229`
3. Set breakpoints in your code

---

## 🧪 Testing Scripts

### Run Tests

```bash
npm run test
```

**What it does:**
- Runs Jest with TypeScript support
- Uses `jest.config.ts` configuration
- `--verbose`: Shows individual test results
- `--detectOpenHandles`: Warns about async operations not closed
- `--forceExit`: Forces Jest to exit after tests complete

**Test files pattern:** `*.spec.ts`

---

### Run Tests with Coverage

```bash
npm run test:cov
```

**What it does:**
1. Runs Jest with coverage enabled
2. Uses `jest-coverage.config.ts` configuration
3. Generates coverage report in `coverage/` folder
4. Updates README badges with `istanbul-badges-readme`

**Coverage output:**
- HTML report: `coverage/lcov-report/index.html`
- Text summary in terminal
- Badge updates in README

---

### Debug Tests

```bash
npm run test:debug
```

**What it does:**
- Starts Jest with Node.js inspector
- `--inspect-brk`: Breaks on first line
- `--runInBand`: Runs tests sequentially (required for debugging)

**Usage:**
1. Run the command
2. Open `chrome://inspect` in Chrome
3. Click "inspect" on the Node process
4. Set breakpoints in test files

---

### Load Testing

```bash
npm run test:load
```

**What it does:**
- Runs **Artillery** load tests
- Configuration: `.artillery/config.yaml`
- `--record`: Records results to Artillery Cloud
- Requires `--key <token>` for cloud recording

**Artillery** simulates high traffic to test:
- Response times under load
- Error rates
- System resource usage

---

## 🗄️ Database Migrations

### Run All Migrations

```bash
npm run migration:run
```

**What it does:**
- Runs PostgreSQL AND MongoDB migrations **concurrently**
- Uses `concurrently` with `--kill-others-on-fail`
- If one fails, the other is terminated

---

### PostgreSQL Migrations

```bash
# Create new migration
npm run migration-postgres:create

# Run pending migrations
npm run migration-postgres:run

# Revert last migration
npm run migration-postgres:undo
```

**Migration files location:** `src/infra/database/postgres/migrations/`

**Uses:** TypeORM CLI with data source from `src/infra/database/postgres/config.ts`

---

### MongoDB Migrations

```bash
# Create new migration
npm run migration-mongo:create

# Run pending migrations
npm run migration-mongo:run

# Revert last migration
npm run migration-mongo:undo
```

**Migration files location:** Uses `mongo-migrate-ts` configuration

**Uses:** Custom config from `src/infra/database/mongo/config.ts`

---

## 🐳 Infrastructure Scripts

### Setup Development Environment

```bash
npm run setup
```

**What it does:**
1. `docker-compose -f docker-compose-infra.yml down -v --remove-orphans`
   - Stops all containers from this compose
   - Removes volumes (`-v`) - **⚠️ DELETES ALL DATA**
   - Removes orphan containers
2. `docker-compose -f docker-compose-infra.yml up -d` - Starts fresh containers

**Services started:**
- PostgreSQL (+ PgAdmin)
- MongoDB Replica Set (Primary + Secondary + Tertiary + Mongo Express)
- Redis
- Zipkin (tracing)
- Prometheus + Alertmanager (metrics)
- Grafana + Loki + Promtail (logging)
- OpenTelemetry Collector

**⚠️ Warning:** This command **destroys all infrastructure data**. Use only for fresh setup.

**Note:** This command only affects containers/volumes from `docker-compose-infra.yml`. Other Docker resources are not affected.

---

## 🐳 Docker Scripts

> **📖 See also:** [Docker Reference](docker.md) for detailed Dockerfile and docker-compose documentation.

### Build Docker Image

```bash
npm run docker:build
```

**What it does:**
- Builds production Docker image using multi-stage build
- Image name: `nestjs-api`
- Uses `Dockerfile` with:
  - **Build stage**: Full Node.js image (for SWC compilation)
  - **Production stage**: Alpine image (smaller footprint)

---

### Run Docker Container

```bash
npm run docker:run
```

**What it does:**
- Runs the `nestjs-api` container
- Uses `--network host` to access local infrastructure (MongoDB, Redis, etc.)
- Loads environment variables from `.env`
- Container is removed when stopped (`--rm`)

**Prerequisites:**
- Run `npm run setup` first to start infrastructure
- Run `npm run docker:build` to create the image

---

### Stop Docker Container

```bash
npm run docker:stop
```

**What it does:**
- Stops the running `nestjs-api` container
- Silently succeeds if container is not running (safe to call anytime)
- Uses error suppression (`2>/dev/null || true`) for clean output

---

### Build and Run (All-in-One)

```bash
npm run docker:start
```

**What it does:**
1. Stops any existing container (`docker:stop`)
2. Builds the Docker image (`docker:build`)
3. Runs the container (`docker:run`)

**Typical workflow:**
```bash
npm run setup         # Start infrastructure (first time or reset)
npm run docker:start  # Build and run the API
```

---

## 🛠️ Code Generation

### Scaffold CRUD Module

```bash
npm run scaffold
```

**What it does:**
- Runs `@mikemajesty/microservice-crud` CLI
- Interactive prompt to generate:
  - Entity
  - Repository
  - Use cases (Create, Update, Delete, GetById, List)
  - Controller
  - Module
  - Tests

**Generated structure:**
```
src/
  core/<entity>/
    entity/<entity>.ts
    repository/<entity>.ts
    use-cases/
      __tests__/
  modules/<entity>/
    adapter.ts
    controller.ts
    module.ts
    repository.ts
```

---

## 📝 Code Quality Scripts

### Format Code

```bash
npm run prettier
```

**What it does:**
- Formats all JSON files in `src/` with Prettier
- Uses `.prettierrc` configuration

---

### Lint Code

```bash
npm run lint
```

**What it does:**
- Runs ESLint on `src/` and `test/` directories
- `--fix`: Auto-fixes problems when possible
- Checks `.ts` and `.js` files

**ESLint plugins used:**
- `@typescript-eslint` - TypeScript rules
- `eslint-plugin-security` - Security best practices
- `eslint-plugin-simple-import-sort` - Import organization
- `eslint-plugin-prettier` - Prettier integration

---

### Check Dependencies

```bash
npm run check-newest:deps
```

**What it does:**
- Runs `npm-check-updates`
- Shows available updates for all dependencies
- Does NOT update `package.json` (safe to run)

**To update:** `npx npm-check-updates -u` then `npm install`

---

## 🔧 Git Hooks (Husky)

### Prepare Husky

```bash
npm run prepare
```

**What it does:**
- Installs Husky git hooks
- Runs automatically after `npm install`

**Hooks configured:**
- `pre-commit`: Runs lint-staged
- `commit-msg`: Validates commit message (commitlint)

---

### Make Coverage Badges

```bash
npm run make-badges
```

**What it does:**
- Updates coverage badges in README.md
- Uses `istanbul-badges-readme`
- Run after `test:cov` to update badges

---

## 📦 Key Dependencies Explained

### Runtime Dependencies

| Package | Purpose |
|---------|---------|
| `@nestjs/*` | NestJS framework core |
| `mongoose` | MongoDB ODM |
| `typeorm` | PostgreSQL ORM |
| `redis` | Redis client for caching |
| `helmet` | Security headers |
| `pino` | High-performance logging |
| `zod` | Runtime validation |
| `axios` | HTTP client |
| `opossum` | Circuit breaker |
| `pm2` | Process manager |
| `i18next` | Internationalization |
| `@opentelemetry/*` | Distributed tracing |

### Development Dependencies

| Package | Purpose |
|---------|---------|
| `jest` | Testing framework |
| `@testcontainers/*` | Docker containers for tests |
| `supertest` | HTTP testing |
| `eslint` | Code linting |
| `prettier` | Code formatting |
| `husky` | Git hooks |
| `semantic-release` | Automated releases |
| `artillery` | Load testing |
| `@swc/*` | Fast TypeScript compiler |

---

## 🔄 CI/CD Integration

### Semantic Release

The project uses **semantic-release** for automated versioning and releases.

**Plugins configured:**
- `@semantic-release/changelog` - Generates CHANGELOG.md
- `@semantic-release/git` - Commits release changes
- `@semantic-release/github` - Creates GitHub releases
- `@semantic-release/npm` - Updates package version

**Commit format:** Conventional Commits
```
feat: add new feature     → Minor version (1.x.0)
fix: bug fix              → Patch version (1.0.x)
feat!: breaking change    → Major version (x.0.0)
```

---

## Common Workflows

### Fresh Development Setup

```bash
# 1. Clone repository
git clone <repo>
cd nestjs-microservice-boilerplate-api

# 2. Install dependencies
npm install

# 3. Start infrastructure
npm run setup

# 4. Start development server
npm run start:dev

# 5. Open http://localhost:3000/api-docs
```

### Before Committing

```bash
# 1. Run linter
npm run lint

# 2. Run tests
npm run test

# 3. Commit (husky will validate)
git commit -m "feat: your feature"
```

### Creating a New Module

```bash
# 1. Run scaffold
npm run scaffold

# 2. Follow interactive prompts
# 3. Run migrations if needed
npm run migration-postgres:create
# Edit migration file
npm run migration:run
```
