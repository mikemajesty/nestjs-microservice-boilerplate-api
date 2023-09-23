# Nestjs boilerplate Microservice API

In this microservice I used the best architecture concepts: onion architecture, DDD and clean architecture.

#### This microservice has only been tested on Linux and WSL2. If you have connection problems with Mongodb(replicaset) on MACos fix it and send me the PR.

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
- `(x) POTGRES:CRUD`
- `( ) MONGO:CRUD `
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
  $ yarn migration:create
  ```
- run
  ```
  $ yarn migration:run  ***/

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

- Docker
- Observability
  - tracing
  - log
  - metrics
- Git hooks
  - Husky
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
- Anti Corruption Layer Pattern
- Interface Adapter Pattern
- Generic Repository Pattern
  - Mongo Repository (mongooose)
  - Postgres Repository (sequelize)
- Swaggger Documentation
- Cache Service
  - Redis
  - NodeCache
- Databse
  - mongo
    - Seed
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
├── commitlint.config.js
├── database.json
├── docker-compose.yml
├── jest.config.ts
├── nest-cli.json
├── package.json
├── README.md
├── scripts
│   ├── mongo
│   │   ├── rs-init.sh
│   │   └── start-replicaset.sh
│   ├── npm-audit.sh
│   └── postgres
│   |    └── create-database.sql
│   └── prometheus
│       └── collector-config.yaml
│       └── config.yml
├── src
│   ├── app.module.ts
│   ├── core
│   │   ├── cats
│   │   │   ├── entity
│   │   │   │   └── cats.ts
│   │   │   ├── repository
│   │   │   │   └── cats.ts
│   │   │   └── use-cases
│   │   │       ├── cats-create.ts
│   │   │       ├── cats-delete.ts
│   │   │       ├── cats-getByID.ts
│   │   │       ├── cats-list.ts
│   │   │       ├── cats-update.ts
│   │   │       └── __tests__
│   │   │           ├── cats-create.spec.ts
│   │   │           ├── cats-delete.spec.ts
│   │   │           ├── cats-list.spec.ts
│   │   │           ├── cats-update.spec.ts
│   │   │           └── user-getByID.spec.ts
│   │   └── user
│   │       ├── entity
│   │       │   └── user.ts
│   │       ├── repository
│   │       │   └── user.ts
│   │       └── use-cases
│   │           ├── __tests__
│   │           │   ├── user-create.spec.ts
│   │           │   ├── user-delete.spec.ts
│   │           │   ├── user-getByID.spec.ts
│   │           │   ├── user-list.spec.ts
│   │           │   ├── user-login.spec.ts
│   │           │   ├── user-logout.spec.ts
│   │           │   └── user-update.spec.ts
│   │           ├── user-create.ts
│   │           ├── user-delete.ts
│   │           ├── user-getByID.ts
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
│   │   │   │   ├── index.ts
│   │   │   │   ├── module.ts
│   │   │   │   ├── schemas
│   │   │   │   │   └── user.ts
│   │   │   │   ├── seed
│   │   │   │   │   └── create-user-admin.ts
│   │   │   │   └── service.ts
│   │   │   ├── postgres
│   │   │   │   ├── config.ts
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
│   │   │   └── types.ts
│   │   └── secrets
│   │       ├── adapter.ts
│   │       ├── index.ts
│   │       ├── module.ts
│   │       └── service.ts
│   ├── libs
│   │   └── auth
│   │       ├── adapter.ts
│   │       ├── index.ts
│   │       ├── module.ts
│   │       ├── service.ts
│   │       └── types.ts
│   ├── main.ts
│   ├── modules
│   │   ├── cats
│   │   │   ├── adapter.ts
│   │   │   ├── controller.ts
│   │   │   ├── module.ts
│   │   │   ├── repository.ts
│   │   │   └── swagger.ts
│   │   ├── health
│   │   │   ├── controller.ts
│   │   │   ├── module.ts
│   │   │   └── __tests__
│   │   │       └── controller.spec.ts
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
│       ├── database
│       │   ├── mongoose.ts
│       │   └── sequelize.ts
│       ├── decorators
│       │   ├── database
│       │   │   ├── mongo
│       │   │   │   ├── convert-mongoose-filter.decorator.ts
│       │   │   │   └── validate-mongoose-filter.decorator.ts
│       │   │   ├── postgres
│       │   │   │   ├── convert-paginate-input-to-sequelize-filter.decorator.ts
│       │   │   │   └── convert-sequelize-filter.decorator.ts
│       │   │   └── validate-database-sort-allowed.decorator.ts
│       │   ├── role.decorator.ts
│       │   ├── types.ts
│       │   └── validate-schema.decorator.ts
│       ├── entity.ts
│       ├── exception.ts
│       ├── filters
│       │   └── http-exception.filter.ts
│       ├── interceptors
│       │   ├── auth-guard.interceptor.ts
│       │   ├── http-exception.interceptor.ts
│       │   ├── http-logger.interceptor.ts
│       │   └── http-tracing.interceptor.ts
│       ├── middlewares
│       │   └── is-logged.middleware.ts
│       ├── mocks
│       │   ├── cats.ts
│       │   └── user.ts
│       ├── pagination.ts
│       ├── request.ts
│       ├── search.ts
│       ├── tracing.ts
│       ├── sort.ts
│       ├── static
│       │   └── htttp-status.json
│       ├── swagger.ts
│       └── tests.ts
├── test
│   └── initializaion.ts
├── TRACING.md
├── tsconfig.build.json
└── tsconfig.json
```

---

The following is a list of all the people that have contributed Nestjs monorepo boilerplate. Thanks for your contributions!

[<img alt="mikemajesty" src="https://avatars1.githubusercontent.com/u/11630212?s=460&v=4&s=117" width="117">](https://github.com/mikemajesty)

## License

It is available under the MIT license.
[License](https://opensource.org/licenses/mit-license.php)
