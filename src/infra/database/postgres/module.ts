import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import path from 'path'
import { DataSource, DataSourceOptions } from 'typeorm'

import { LoggerService } from '@/infra/logger'
import { SnakeNamingStrategy } from '@/infra/repository/util'
import { ISecretsAdapter, SecretsModule } from '@/infra/secrets'

import { name } from '../../../../package.json'
import { PostgresConnectionName } from '../enum'
import { POSTGRES_POOL_OPTIONS } from './pool-options'
import { PostgresService } from './service'

const logger = new LoggerService()

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      name: PostgresConnectionName.POSTGRES,
      useFactory: ({ POSTGRES: { POSTGRES_URL }, IS_LOCAL }: ISecretsAdapter) => {
        const conn = new PostgresService().getConnection({ URI: POSTGRES_URL })
        logger.log(
          `🐘 postgres SSL: ${POSTGRES_URL.includes('sslmode=require') ? 'enabled (sslmode=require detected)' : 'disabled'}`
        )
        return {
          ...conn,
          connectTimeoutMS: 10000,
          logging: false,
          autoLoadEntities: true,
          namingStrategy: new SnakeNamingStrategy(),
          synchronize: IS_LOCAL,
          migrationsTableName: 'migrations',
          migrations: [path.join(__dirname, '/migrations/*.{ts,js}')],
          entities: [path.join(__dirname, '/schemas/*.{ts,js}')],
          applicationName: name,
          extra: {
            ...POSTGRES_POOL_OPTIONS
          }
        }
      },
      async dataSourceFactory(options) {
        const dataSource = new DataSource(options as DataSourceOptions)
        return dataSource.initialize()
      },
      imports: [SecretsModule],
      inject: [ISecretsAdapter]
    })
  ]
})
export class PostgresDatabaseModule {}
