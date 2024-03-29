import 'dotenv/config';

import { mongoMigrateCli } from 'mongo-migrate-ts';
import path from 'path';

mongoMigrateCli({
  uri: process.env['MONGO_URL'],
  database: process.env['MONGO_DATABASE'],
  migrationsDir: path.join(__dirname, './migrations'),
  migrationsCollection: 'migrations_collection'
});
