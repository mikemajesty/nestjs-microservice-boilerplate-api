import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import path from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

import { ISecretsAdapter, SecretsModule } from '@/infra/secrets';

import { PostgresService } from './service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: ({ POSTGRES: { POSTGRES_URL }, IS_LOCAL }: ISecretsAdapter) => {
        const conn = new PostgresService().getConnection({ URI: POSTGRES_URL });
        return {
          ...conn,
          timeout: 5000,
          connectTimeout: 5000,
          logging: IS_LOCAL,
          autoLoadEntities: true,
          namingStrategy: new SnakeNamingStrategy(),
          synchronize: IS_LOCAL,
          migrationsTableName: 'migrations',
          migrations: [path.join(__dirname, '/migrations/*.{ts,js}')],
          entities: [path.join(__dirname, '/schemas/*.{ts,js}')]
        };
      },
      async dataSourceFactory(options) {
        const dataSource = new DataSource(options as DataSourceOptions);
        return dataSource.initialize();
      },
      imports: [SecretsModule],
      inject: [ISecretsAdapter]
    })
  ]
})
export class PostgresDatabaseModule {}
