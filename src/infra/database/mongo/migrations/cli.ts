import { runMongoMigrationCLI } from '@mikemajesty/mongo-migration'
import 'dotenv/config'
import path from 'path'
import { CreateCatsCollection } from './0001_create-cats-collection'

runMongoMigrationCLI({
  uri: process.env.MONGO_URL as string,
  dbName: process.env.MONGO_DATABASE as string,
  changelogCollection: 'changelog',
  migrations: [new CreateCatsCollection()],
  logLevels: ['warn', 'error'],
  migrationsPath: path.resolve(__dirname)
})
