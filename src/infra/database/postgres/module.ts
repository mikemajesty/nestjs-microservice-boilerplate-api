import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import path from 'path';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

import { ISecretsAdapter, SecretsModule } from '@/infra/secrets';

import { PostgresService } from './service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: ({ POSTGRES_URL, ENV }: ISecretsAdapter) => {
        const conn = new PostgresService().getConnection({ URI: POSTGRES_URL });
        const isLocal = ENV === 'local';
        return {
          ...conn,
          timeout: 5000,
          connectTimeout: 5000,
          logging: isLocal,
          autoLoadEntities: true,
          namingStrategy: new SnakeNamingStrategy(),
          synchronize: isLocal,
          migrationsTableName: 'migration_collection',
          migrations: [path.join(__dirname, '/migrations/*.{ts,js}')],
          entities: [path.join(__dirname, '/schemas/*.{ts,js}')]
        };
      },
      async dataSourceFactory(options) {
        const dataSource = new DataSource(options);
        return dataSource.initialize();
      },
      imports: [SecretsModule],
      inject: [ISecretsAdapter]
    })
  ]
})
export class PostgresDatabaseModule {}
