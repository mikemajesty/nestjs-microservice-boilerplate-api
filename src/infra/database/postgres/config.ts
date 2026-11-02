/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/infra/database.md
 */
import 'dotenv/config'

import path from 'path'
import { DataSource, DataSourceOptions } from 'typeorm'

import { name } from '../../../../package.json'
import { SnakeNamingStrategy } from '../../repository/util'
import { SecretsService } from '../../secrets/service'
import { POSTGRES_POOL_OPTIONS } from './pool-options'

const entities = [path.join(__dirname, 'schemas/*.{ts,js}')]
const migrations = [path.join(__dirname, 'migrations/*.{ts,js}')]
const postgresUrl = SecretsService.buildPostgresUrl()

const parsedPostgresUrl = new URL(postgresUrl)
const requireSsl = parsedPostgresUrl.searchParams.get('sslmode') === 'require'

if (requireSsl) {
  parsedPostgresUrl.searchParams.delete('sslmode')
}

const dataSource = new DataSource({
  type: 'postgres',
  url: parsedPostgresUrl.toString(),
  schema: process.env.POSTGRES_SCHEMA,
  namingStrategy: new SnakeNamingStrategy(),
  logger: 'advanced-console',
  ssl:
    requireSsl || process.env.POSTGRES_SSL === 'true'
      ? {
          rejectUnauthorized: false
        }
      : false,
  applicationName: name,
  extra: {
    ...POSTGRES_POOL_OPTIONS
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
