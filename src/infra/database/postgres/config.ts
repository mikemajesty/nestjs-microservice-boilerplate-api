import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';

config();

const configService = new ConfigService();

export default new DataSource({
  type: 'postgres',
  host: configService.get('POSTGRES_HOST'),
  port: configService.get('POSTGRES_PORT'),
  username: configService.get('POSTGRES_USER'),
  password: configService.get('POSTGRES_PASSWORD'),
  database: configService.get('POSTGRES_DATABASE'),
  migrationsTableName: 'migrations_table',
  synchronize: configService.get<string>('ENV').toLowerCase() !== 'prd',
  migrations: ['src/infra/database/postgres/migrations/*.ts'],
  entities: ['src/modules/cats/schema.ts']
});
