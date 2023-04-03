# Nesjt Microservice API

In this microservice I used the best architecture concepts: clean architecture, DDD and onion architecture.

### Building and Running the application

- build
  ```
  $ yarn build
  ```
- running
  ```
   $ docker-compose up build
  ```
  ```
   $ yarn start | start:debug | start:prod
  ```

### CRUD Scafold

Creating a crud in Postgres and Mongo in seconds.

- run
  ```
  $ yarn scafold
  ```
- Choose database for CRUD.
- `(x) POTGRES:CRUD`
- `( ) MONGO:CRUD `
- choose root microservice api folder
- import new module 'app.module.ts'
- ✨Magic ✨

### Postgres migrations

- create
  ```
  $ yarn migration-postgres:create
  ```
- run
  ```
  $ yarn migration-postgres:run
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

- run
  ```
  $ yarn lint
  ```
- prettier
  ```
  $ yarn format
  ```

##### Microservice architecture.

- Docker
- Git hooks
  - Husky
- Secrets Service
- Logs Service
- Authentication
- Authorization
- Error Handler
- Libs Structure
- Dependency Inversion Pattern
- Usecase Pattern
- Anti Corruption Layer Pattern
- Interface Adapter Pattern
- Swaggger Documentation
- Generic Repository Pattern
  - Mongo Repository
  - Postgres Repository
- Cache Service
  - Redis
  - NodeCache
- Databse
  - mongo
    - Seed
  - postgres
    - Migrations
- Tests
  - unit
  - 100% coverage

---

The following is a list of all the people that have contributed Nestjs monorepo boilerplate. Thanks for your contributions!

[<img alt="mikemajesty" src="https://avatars1.githubusercontent.com/u/11630212?s=460&v=4&s=117" width="117">](https://github.com/mikemajesty)

## License

It is available under the MIT license.
[License](https://opensource.org/licenses/mit-license.php)
