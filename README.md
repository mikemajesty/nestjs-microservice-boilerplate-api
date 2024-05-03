# Nestjs boilerplate Microservice API

In this microservice I used the best architecture concepts: onion architecture, DDD and clean architecture.

| Statements                                                                               | Branches                                                                             | Functions                                                                              | Lines                                                                          |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| ![Statements](https://img.shields.io/badge/statements-100%25-brightgreen.svg?style=flat) | ![Branches](https://img.shields.io/badge/branches-100%25-brightgreen.svg?style=flat) | ![Functions](https://img.shields.io/badge/functions-100%25-brightgreen.svg?style=flat) | ![Lines](https://img.shields.io/badge/lines-100%25-brightgreen.svg?style=flat) |

### Building and Running the application

- install dependencies
  ```
  $ yarn
  ```
- infra
  ```
   $ yarn infra
  ```
- running

  - dev
    ```
    $ yarn start:dev
    ```
  - debug
    ```
    $ start:debug
    ```
  - production
    ```
    $ yarn start
    ```

- build

  ```
  $ yarn build
  ```

### CRUD Scaffolding

Creating a CRUD in Postgres and Mongo in seconds.

- run
  ```
  $ yarn scaffold
  ```
- Choose database for CRUD.
- `(x) POSTGRES:CRUD`
- `( ) MONGO:CRUD`
- `( ) LIB`
- `( ) INFRA`
- `( ) MODULE`
- type module name (use the singular name)
- After generating the CRUD, follow the instructions on the generated link.
- ✨Magic ✨

#### CRUD features

- List
  - mongo
    - search
    - pagination
    - sort
    - entity validation
  - postgres
    - search
    - pagination
    - sort
    - entity validation
- Delete
  - mongo
    - Logical deletion
    - entity validation
  - postgres
    - Logical deletion
    - entity validation
- Update
  - mongo
    - Update Partial entity
    - entity validation
  - postgres
    - Update Partial entity
    - entity validation
- Create
  - mongo
    - entity validation
    - Not allow creating duplicates
  - postgres
    - entity validation

### Postgres migrations

- create
  ```
  $ yarn migration-postgres:create
  ```
- run

  ```
  $ yarn migration-postgres:run
  ```

### Mongo migrations
- create
  ```
  $ yarn migration-mongo:create
  ```
- run

  ```
  $ yarn migration-mongo:run
  ```

### Test

- run
  ```
  $ yarn test
  ```
- coverage
  ```
  $ yarn test:cov
  ```

### Lint

- lint
  ```
  $ yarn lint
  ```
- prettier
  ```
  $ yarn prettier
  ```

### Microservice architecture.

- I18n
- Docker
- Observability
  - tracing
  - logs
  - metrics
- Lint-staged + Husky
- Commitlint
- Secrets Service
- HTTP Service
- Logger Service
  - mongodb transport
- Authentication
  - Login
  - Logout
- Authorization
  - Role-based access
- Error Handler
- Libs Structure
- Dependency Inversion Pattern
- Usecase Pattern
- Interface Adapter Pattern
- Generic Repository Pattern
  - Mongo Repository (mongoose)
  - Postgres Repository (sequelize)
- Swagger Documentation
- Cache Service
  - Redis
  - NodeCache
- Database
  - mongo
    - Migrations
    - Replica set
    - Transaction session
  - postgres
    - Migrations
    - Transaction session
- Tests
  - unit
  - 100% coverage

-- App Skeleton

```
.
├── CHANGELOG.md
├── Dockerfile
├── README.md
├── TRACING.md
├── commitlint.config.js
├── docker
│   ├── collector
│   │   └── collector-config.yaml
│   ├── mongo
│   │   ├── rs-init.sh
│   │   └── start-replicaset.sh
│   ├── postgres
│   │   └── create-database.sql
│   └── prometheus
│       └── config.yml
├── docker-compose-infra.yml
├── docker-compose.yml
├── jest.config.ts
├── nest-cli.json
├── package-lock.json
├── package.json
├── scripts
│   └── npm-audit.sh
├── src
│   ├── app.module.ts
│   ├── common
│   │   ├── decorators
│   │   │   ├── database
│   │   │   │   ├── mongo
│   │   │   │   │   ├── convert-mongoose-filter.decorator.ts
│   │   │   │   │   └── validate-mongoose-filter.decorator.ts
│   │   │   │   ├── postgres
│   │   │   │   │   ├── convert-paginate-input-to-sequelize-filter.decorator.ts
│   │   │   │   │   └── convert-sequelize-filter.decorator.ts
│   │   │   │   └── validate-database-sort-allowed.decorator.ts
│   │   │   ├── index.ts
│   │   │   ├── request-timeout.decorator.ts
│   │   │   ├── role.decorator.ts
│   │   │   ├── types.ts
│   │   │   └── validate-schema.decorator.ts
│   │   ├── filters
│   │   │   ├── http-exception.filter.ts
│   │   │   └── index.ts
│   │   ├── interceptors
│   │   │   ├── auth-guard.interceptor.ts
│   │   │   ├── http-exception.interceptor.ts
│   │   │   ├── http-logger.interceptor.ts
│   │   │   ├── index.ts
│   │   │   ├── metrics.interceptor.ts
│   │   │   ├── request-timeout.interceptor.ts
│   │   │   └── tracing.interceptor.ts
│   │   └── middlewares
│   │       ├── index.ts
│   │       └── is-logged.middleware.ts
│   ├── core
│   │   ├── cats
│   │   │   ├── entity
│   │   │   │   └── cats.ts
│   │   │   ├── repository
│   │   │   │   └── cats.ts
│   │   │   └── use-cases
│   │   │       ├── __tests__
│   │   │       │   ├── cats-create.spec.ts
│   │   │       │   ├── cats-delete.spec.ts
│   │   │       │   ├── cats-list.spec.ts
│   │   │       │   ├── cats-update.spec.ts
│   │   │       │   └── user-get-by-id.spec.ts
│   │   │       ├── cats-create.ts
│   │   │       ├── cats-delete.ts
│   │   │       ├── cats-get-by-id.ts
│   │   │       ├── cats-list.ts
│   │   │       └── cats-update.ts
│   │   └── user
│   │       ├── entity
│   │       │   └── user.ts
│   │       ├── repository
│   │       │   └── user.ts
│   │       └── use-cases
│   │           ├── __tests__
│   │           │   ├── user-create.spec.ts
│   │           │   ├── user-delete.spec.ts
│   │           │   ├── user-get-by-id.spec.ts
│   │           │   ├── user-list.spec.ts
│   │           │   ├── user-login.spec.ts
│   │           │   ├── user-logout.spec.ts
│   │           │   └── user-update.spec.ts
│   │           ├── user-create.ts
│   │           ├── user-delete.ts
│   │           ├── user-get-by-id.ts
│   │           ├── user-list.ts
│   │           ├── user-login.ts
│   │           ├── user-logout.ts
│   │           └── user-update.ts
│   ├── infra
│   │   ├── cache
│   │   │   ├── adapter.ts
│   │   │   ├── index.ts
│   │   │   ├── memory
│   │   │   │   ├── index.ts
│   │   │   │   ├── module.ts
│   │   │   │   ├── service.ts
│   │   │   │   └── types.ts
│   │   │   ├── redis
│   │   │   │   ├── index.ts
│   │   │   │   ├── module.ts
│   │   │   │   ├── service.ts
│   │   │   │   └── types.ts
│   │   │   └── types.ts
│   │   ├── database
│   │   │   ├── adapter.ts
│   │   │   ├── enum.ts
│   │   │   ├── index.ts
│   │   │   ├── mongo
│   │   │   │   ├── config.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── migrations
│   │   │   │   │   ├── 1709943706267_create-user-collection.ts
│   │   │   │   │   └── 1709944044583_create-user-default.ts
│   │   │   │   ├── module.ts
│   │   │   │   ├── schemas
│   │   │   │   │   └── user.ts
│   │   │   │   └── service.ts
│   │   │   ├── postgres
│   │   │   │   ├── config.js
│   │   │   │   ├── index.ts
│   │   │   │   ├── migrations
│   │   │   │   │   └── 20230416174316-create-cats-table.js
│   │   │   │   ├── module.ts
│   │   │   │   ├── schemas
│   │   │   │   │   └── cats.ts
│   │   │   │   └── service.ts
│   │   │   └── types.ts
│   │   ├── http
│   │   │   ├── adapter.ts
│   │   │   ├── index.ts
│   │   │   ├── module.ts
│   │   │   └── service.ts
│   │   ├── logger
│   │   │   ├── adapter.ts
│   │   │   ├── index.ts
│   │   │   ├── module.ts
│   │   │   ├── service.ts
│   │   │   └── types.ts
│   │   ├── module.ts
│   │   ├── repository
│   │   │   ├── adapter.ts
│   │   │   ├── index.ts
│   │   │   ├── mongo
│   │   │   │   └── repository.ts
│   │   │   ├── postgres
│   │   │   │   └── repository.ts
│   │   │   ├── types.ts
│   │   │   └── util.ts
│   │   └── secrets
│   │       ├── adapter.ts
│   │       ├── index.ts
│   │       ├── module.ts
│   │       └── service.ts
│   ├── libs
│   │   ├── auth
│   │   │   ├── adapter.ts
│   │   │   ├── index.ts
│   │   │   ├── module.ts
│   │   │   └── service.ts
│   │   └── crypto
│   │       ├── adapter.ts
│   │       ├── index.ts
│   │       ├── module.ts
│   │       └── service.ts
│   ├── main.ts
│   ├── modules
│   │   ├── cats
│   │   │   ├── adapter.ts
│   │   │   ├── controller.ts
│   │   │   ├── module.ts
│   │   │   ├── repository.ts
│   │   │   └── swagger.ts
│   │   ├── health
│   │   │   ├── __tests__
│   │   │   │   └── controller.spec.ts
│   │   │   ├── controller.ts
│   │   │   └── module.ts
│   │   ├── login
│   │   │   ├── adapter.ts
│   │   │   ├── controller.ts
│   │   │   ├── module.ts
│   │   │   └── swagger.ts
│   │   ├── logout
│   │   │   ├── adapter.ts
│   │   │   ├── controller.ts
│   │   │   ├── module.ts
│   │   │   └── swagger.ts
│   │   └── user
│   │       ├── adapter.ts
│   │       ├── controller.ts
│   │       ├── module.ts
│   │       ├── repository.ts
│   │       └── swagger.ts
│   └── utils
│       ├── axios.ts
│       ├── collection.ts
│       ├── database
│       │   ├── mongoose.ts
│       │   └── sequelize.ts
│       ├── date.ts
│       ├── docs
│       │   ├── data
│       │   │   ├── cats
│       │   │   │   ├── request.ts
│       │   │   │   └── response.ts
│       │   │   └── user
│       │   │       ├── request.ts
│       │   │       └── response.ts
│       │   └── swagger.ts
│       ├── entity.ts
│       ├── exception.ts
│       ├── pagination.ts
│       ├── request.ts
│       ├── search.ts
│       ├── sort.ts
│       ├── static
│       │   └── http-status.json
│       ├── tests
│       │   └── tests.ts
│       └── tracing.ts
├── test
│   └── initialization.js
├── tsconfig.build.json
├── tsconfig.json
└── yarn.lock
```

---

The following is a list of all the people that have contributed Nestjs monorepo boilerplate. Thanks for your contributions!

[<img alt="mikemajesty" src="https://avatars1.githubusercontent.com/u/11630212?s=460&v=4&s=117" width="117">](https://github.com/mikemajesty)

## License

It is available under the MIT license.
[License](https://opensource.org/licenses/mit-license.php)
