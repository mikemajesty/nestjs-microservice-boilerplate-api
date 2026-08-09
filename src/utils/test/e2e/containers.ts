/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/tests/containers.md
 */
import { Test, TestingModule } from '@nestjs/testing'
import { CachePlugin } from '@nestjs-redisx/cache'
import { RedisModule, RedisService as RedisXService } from '@nestjs-redisx/core'
import { MongoDBContainer, StartedMongoDBContainer } from '@testcontainers/mongodb'
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql'
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis'
import mongoose from 'mongoose'
import path from 'path'
import { DataSource, DataSourceOptions } from 'typeorm'

import { ICacheAdapter } from '@/infra/cache'
import { RedisService } from '@/infra/cache/redis'
import { ConnectionName } from '@/infra/database/enum'
import { PostgresService } from '@/infra/database/postgres'
import { ILoggerAdapter, LoggerService } from '@/infra/logger'
import { SnakeNamingStrategy } from '@/infra/repository/util'

import { ApiUnprocessableEntityException } from '../../exception'

export class TestMongoContainer {
  mongoContainer!: StartedMongoDBContainer
  mongoDatabase = process.env.MONGO_DATABASE
  getTestMongo = async (conectionName: ConnectionName): Promise<{ mongoConnection: mongoose.Connection }> => {
    this.mongoContainer = await new MongoDBContainer('mongo:7.0.2').start()

    if (!this.mongoDatabase) {
      throw new ApiUnprocessableEntityException('MONGO_DATABASE env var is not set')
    }
    const mongo: mongoose.Connection = mongoose
      .createConnection(this.mongoContainer.getConnectionString(), { directConnection: true, appName: conectionName })
      .useDb(this.mongoDatabase, { useCache: true })
    return { mongoConnection: mongo }
  }

  async close() {
    await this.mongoContainer.stop()
  }
}

export class TestPostgresContainer {
  postgresDatabase = process.env.POSTGRES_DATABASE
  postgresContainer!: StartedPostgreSqlContainer
  private readonly postgresImage = 'postgres:16.1-alpine'

  private getTestPostgres = async (): Promise<StartedPostgreSqlContainer> => {
    const postgres = new PostgreSqlContainer(this.postgresImage)
    if (!this.postgresDatabase) {
      throw new ApiUnprocessableEntityException('POSTGRES_DATABASE env var is not set')
    }
    postgres.withDatabase(this.postgresDatabase)

    this.postgresContainer = await postgres.start()

    return this.postgresContainer
  }

  getPostgres = async (): Promise<{ postgresConfig: DataSourceOptions }> => {
    const database = process.env.POSTGRES_DATABASE
    if (!database) {
      throw new ApiUnprocessableEntityException('POSTGRES_DATABASE env var is not set')
    }

    const postgresConection = await this.getTestPostgres()
    const postgresConfig = this.getConfiguration(postgresConection)
    return { postgresConfig }
  }

  public async getDataSource(options: DataSourceOptions | undefined) {
    const dataSource = new DataSource(options as DataSourceOptions)
    const source = await dataSource.initialize()
    return source
  }

  private getConfiguration = (postgresConection: StartedPostgreSqlContainer): DataSourceOptions => {
    const conn = new PostgresService().getConnection({ URI: postgresConection.getConnectionUri() }) as Omit<
      DataSourceOptions,
      'type'
    >
    const mihrationPath = path.join(process.cwd(), '/src/infra/database/postgres/migrations/*.{ts,js}')
    const entitiesPath = path.join(process.cwd(), '/src/infra/database/postgres/schemas/*.{ts,js}')
    return {
      type: 'postgres',
      ...conn,
      timeout: 5000,
      connectTimeout: 5000,
      logging: false,
      migrationsRun: true,
      migrate: true,
      migrations: [mihrationPath],
      autoLoadEntities: true,
      namingStrategy: new SnakeNamingStrategy(),
      entities: [entitiesPath]
    } as DataSourceOptions
  }

  async close() {
    await this.postgresContainer.stop()
  }
}

export class TestRedisContainer {
  redisContainer!: StartedRedisContainer
  private redisModule!: TestingModule

  getTestRedis = async (): Promise<ICacheAdapter> => {
    const logger: ILoggerAdapter = { error: console.error, log: LoggerService.log } as ILoggerAdapter
    this.redisContainer = await new RedisContainer('redis:7.2.4-alpine').start()

    this.redisModule = await Test.createTestingModule({
      imports: [
        RedisModule.forRoot({
          clients: { url: this.redisContainer.getConnectionUrl() },
          plugins: [new CachePlugin()],
          global: { driver: 'node-redis' }
        })
      ]
    }).compile()
    await this.redisModule.init()

    const conn = new RedisService(logger, this.redisModule.get(RedisXService))
    return conn as Partial<ICacheAdapter> as ICacheAdapter
  }

  async close() {
    await this.redisModule?.close()
    await this.redisContainer?.stop()
  }
}
