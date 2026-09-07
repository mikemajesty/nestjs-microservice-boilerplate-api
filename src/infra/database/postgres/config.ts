/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/infra/database.md
 */
import { config } from 'dotenv'
import path from 'path'
import { DataSource, DataSourceOptions } from 'typeorm'

import { SnakeNamingStrategy } from '../../repository/util'

config()

const entities = [path.join(__dirname, 'schemas/*.{ts,js}')]
const migrations = [path.join(__dirname, 'migrations/*.{ts,js}')]
const postgresUrl =
  process.env.POSTGRES_URL ||
  `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DATABASE}`

const dataSource = new DataSource({
  type: 'postgres',
  url: postgresUrl,
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
} as DataSourceOptions)

export default dataSource
