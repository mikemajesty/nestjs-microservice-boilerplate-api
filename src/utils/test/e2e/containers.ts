/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/tests/containers.md
 */
import { MongoDBContainer, StartedMongoDBContainer } from '@testcontainers/mongodb'
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql'
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis'
import mongoose from 'mongoose'
import path from 'path'
import { createClient, RedisClientType } from 'redis'
import { DataSource, DataSourceOptions } from 'typeorm'
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions'
import { SnakeNamingStrategy } from 'typeorm-naming-strategies'

import { ICacheAdapter } from '@/infra/cache'
import { RedisService } from '@/infra/cache/redis'
import { ConnectionName } from '@/infra/database/enum'
import { PostgresService } from '@/infra/database/postgres'
import { ILoggerAdapter, LoggerService } from '@/infra/logger'

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

  private getTestPostgres = async (): Promise<StartedPostgreSqlContainer> => {
    const postgres = new PostgreSqlContainer('postgres:16.1-alpine')
    if (!this.postgresDatabase) {
      throw new ApiUnprocessableEntityException('POSTGRES_DATABASE env var is not set')
    }
    postgres.withDatabase(this.postgresDatabase)

    this.postgresContainer = await postgres.start()

    return this.postgresContainer
  }

  getPostgres = async (): Promise<{ postgresConfig: PostgresConnectionOptions }> => {
    const postgres = new PostgreSqlContainer('14.1')
    const database = process.env.POSTGRES_DATABASE
    if (!database) {
      throw new ApiUnprocessableEntityException('POSTGRES_DATABASE env var is not set')
    }
    postgres.withDatabase(database)

    const postgresConection = await this.getTestPostgres()
    const postgresConfig = this.getConfiguration(postgresConection)
    return { postgresConfig }
  }

  public async getDataSource(options: DataSourceOptions | undefined) {
    const dataSource = new DataSource(options as DataSourceOptions)
    const source = await dataSource.initialize()
    return source
  }

  private getConfiguration = (postgresConection: StartedPostgreSqlContainer): PostgresConnectionOptions => {
    const conn = new PostgresService().getConnection({ URI: postgresConection.getConnectionUri() }) as Omit<
      PostgresConnectionOptions,
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
    } as PostgresConnectionOptions
  }

  async close() {
    await this.postgresContainer.stop()
  }
}

export class TestRedisContainer {
  redisContainer!: StartedRedisContainer
  client!: RedisClientType

  getTestRedis = async (): Promise<ICacheAdapter> => {
    const logger: ILoggerAdapter = { error: console.error, log: LoggerService.log } as ILoggerAdapter
    this.redisContainer = await new RedisContainer('redis:7.2.4-alpine').start()
    this.client = createClient({ url: this.redisContainer.getConnectionUrl() }) as RedisClientType
    await this.client.connect()
    const conn = new RedisService(logger, this.client)
    return conn as Partial<ICacheAdapter> as ICacheAdapter
  }

  async close() {
    this.client?.destroy()
    await this.redisContainer?.stop()
  }
}
