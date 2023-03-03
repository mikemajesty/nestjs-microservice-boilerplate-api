# Data Enrichment API.

API for data enrichment using **Node/Nestjs**, mongodb, postgresql and RabbitMQ.

## How to start?
 
* Initialize the infra
  ``` 
   docker-compose up --build
  ```
 * install dependencies
   ```
    yarn
   ```
 * start app
   ```
    yarn start:debug
   ```

## Architecture
 ##### This architecture is a mixture of DDD and Clean Architecture, trying to get the best of each one.

  * ```├── src ├── core```: **Core domain Logic**:  Where all the business rules, use cases and abstraction of the repositories are located, do not use frameworks in this layer, use only nodejs.  
  * ```├── src ├── infra```:  **Application infrastructure**: Maps to the layers that hold the Database and Gateway concerns. In here, we define data entities, database access (typically in the shape of repositories), integrations with other network services, caches, etc. This project/layer contains the physical implementation of the interfaces defined in our domain layer.
* ```├── src ├── libs```: **Application Library**: Shared app library.
* ```├── src ├── utils```: **Application Utilities**: Shared app utilities.
* ```├── src ├── modules```: **Application Modules**: App shared modules.


-- App Skeleton
```
.
├── README.md
├── docker-compose.yml
├── nest-cli.json
├── package.json
├── src
│   ├── app.module.ts
│   ├── core
│   │   ├── analysis
│   │   │   ├── entities
│   │   │   │   └── analysis.ts
│   │   │   ├── repository
│   │   │   │   └── analysis.ts
│   │   │   └── use-cases
│   │   │       └── analysis-create.ts
│   │   ├── cats
│   │   │   ├── entities
│   │   │   │   └── cats.ts
│   │   │   ├── repositories
│   │   │   │   └── cats.ts
│   │   │   └── use-cases
│   │   └── user
│   │       ├── entities
│   │       │   └── user.ts
│   │       ├── repositories
│   │       │   └── user.ts
│   │       └── use-cases
│   │           ├── user-create.ts
│   │           ├── user-delete.ts
│   │           ├── user-getByID.ts
│   │           ├── user-list.ts
│   │           ├── user-login.ts
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
│   │   │   │   └── service.ts
│   │   │   ├── postgres
│   │   │   │   ├── index.ts
│   │   │   │   ├── module.ts
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
│   │   ├── rabbitmq
│   │   │   ├── adapter.ts
│   │   │   ├── index.ts
│   │   │   ├── module.ts
│   │   │   └── service.ts
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
│   │   ├── auth
│   │   │   ├── adapter.ts
│   │   │   ├── index.ts
│   │   │   ├── module.ts
│   │   │   ├── service.ts
│   │   │   └── types.ts
│   │   ├── entity.ts
│   │   ├── mongo.ts
│   │   ├── pagination.ts
│   │   ├── sort.ts
│   │   └── swagger.ts
│   ├── main.ts
│   ├── modules
│   │   ├── analysis
│   │   │   ├── adapter.ts
│   │   │   ├── controller.ts
│   │   │   ├── module.ts
│   │   │   ├── repository.ts
│   │   │   ├── schema.ts
│   │   │   ├── swagger.ts
│   │   │   └── types.ts
│   │   ├── health
│   │   │   ├── __tests__
│   │   │   │   └── controller.spec.ts
│   │   │   ├── controller.ts
│   │   │   └── module.ts
│   │   ├── login
│   │   │   ├── adapter.ts
│   │   │   ├── controller.ts
│   │   │   ├── module.ts
│   │   │   ├── swagger.ts
│   │   │   └── types.ts
│   │   ├── polygon
│   │   │   ├── adapter.ts
│   │   │   ├── module.ts
│   │   │   ├── repository.ts
│   │   │   └── types.ts
│   │   ├── sigef
│   │   │   ├── adapter.ts
│   │   │   ├── module.ts
│   │   │   ├── repository.ts
│   │   │   └── types.ts
│   │   └── user
│   │       ├── adapter.ts
│   │       ├── controller.ts
│   │       ├── module.ts
│   │       ├── repository.ts
│   │       ├── schema.ts
│   │       ├── swagger.ts
│   │       └── types.ts
│   └── utils
│       ├── decorators
│       │   └── role.decorator.ts
│       ├── exception.ts
│       ├── filters
│       │   └── http-exception.filter.ts
│       ├── interceptors
│       │   ├── auth-guard.interceptor.ts
│       │   ├── http-exception.interceptor.ts
│       │   └── http-logger.interceptor.ts
│       ├── middlewares
│       │   └── is-logged.middleware.ts
│       └── static
│           └── htttp-status.json
├── test
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
├── tsconfig.build.json
└── tsconfig.json
```