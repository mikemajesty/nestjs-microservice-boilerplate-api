import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ISecretsAdapter, SecretsModule } from '@/infra/secrets';
import { CatsSchema } from '@/modules/cats/schema';

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
          entities: [CatsSchema],
          synchronize: true,
          migrationsTableName: 'migration_collection'
        };
      },
      imports: [SecretsModule],
      inject: [ISecretsAdapter]
    })
  ]
})
export class PostgresDatabaseModule {}
