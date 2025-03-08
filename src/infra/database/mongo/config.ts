import 'dotenv/config';

import { mongoMigrateCli } from 'mongo-migrate-ts';
import path from 'path';

import { LoggerService } from '@/infra/logger';

LoggerService.log(`ENV: ${process.env['NODE_ENV']} mongo migration running.\n`);

mongoMigrateCli({
  uri: process.env['MONGO_URL'],
  database: process.env['MONGO_DATABASE'],
  migrationsDir: path.join(__dirname, './migrations'),
  migrationsCollection: 'migrations'
});
