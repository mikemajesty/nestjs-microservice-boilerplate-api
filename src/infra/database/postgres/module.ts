import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource } from 'typeorm-transactional';

import { ISecretsAdapter, SecretsModule } from '@/infra/secrets';

import { PostgresService } from './service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: ({ POSTGRES_URL }: ISecretsAdapter) => {
        const conn = new PostgresService().getConnection({ URI: POSTGRES_URL });
        return {
          ...conn,
          timeout: 5000,
          connectTimeout: 5000,
          autoLoadEntities: true,
          synchronize: true,
          migrationsTableName: 'migration_collection'
        };
      },
      async dataSourceFactory(options) {
        return addTransactionalDataSource(new DataSource(options));
      },
      imports: [SecretsModule],
      inject: [ISecretsAdapter]
    })
  ]
})
export class PostgresDatabaseModule {}
