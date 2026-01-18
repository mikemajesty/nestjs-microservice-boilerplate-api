/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/infra/database.md
 */
import { config } from 'dotenv'
import { DataSource } from 'typeorm'
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions'
import { SnakeNamingStrategy } from 'typeorm-naming-strategies'

config()

const entities = ['src/infra/database/postgres/schemas/*.{ts,js}']
const migrations = ['src/infra/database/postgres/migrations/*.{ts,js}']

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  schema: process.env.POSTGRES_SCHEMA,
  namingStrategy: new SnakeNamingStrategy(),
  logger: 'advanced-console',
  ssl:
    process.env.POSTGRES_SSL === 'true'
      ? {
          rejectUnauthorized: false
        }
      : false,
  extra: {
    max: 20,
    min: 2,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 300000,
    query_timeout: 5000,
    statement_timeout: 30000,
    application_name: 'nestjs-api',
    acquireTimeoutMillis: 10000,
    createTimeoutMillis: 10000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 500,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000
  },
  migrationsTableName: 'migrations',
  migrations,
  migrationsRun: false,
  migrationsTransactionMode: 'each',
  entities,
  synchronize: false,
  metadataTableName: 'typeorm_metadata'
} as PostgresConnectionOptions)

export default dataSource
