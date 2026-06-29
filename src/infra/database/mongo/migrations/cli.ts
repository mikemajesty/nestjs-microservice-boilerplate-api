import { runMongoMigrationCLI } from '@mikemajesty/mongo-migration'
import 'dotenv/config'
import { CreateCatsCollection } from './0001_createCatsCollection'

runMongoMigrationCLI({
  uri: process.env.MONGO_URL as string,
  dbName: process.env.MONGO_DATABASE as string,
  changelogCollection: 'changelog',
  migrations: [new CreateCatsCollection()],
  logLevels: ['warn', 'error']
})
