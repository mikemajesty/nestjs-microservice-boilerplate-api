import { IDGeneratorUtils } from '@/utils/id-generator'

const createConnectionName = (name: string) => {
  if (process.env.NODE_ENV === 'test') {
    return `${name}_${IDGeneratorUtils.generate()}`
  }
  return name
}

export const MongoConnectionName = {
  MONGO: createConnectionName(`MONGO_CONNECTION`)
} as const

export const PostgresConnectionName = {
  POSTGRES: createConnectionName(`POSTGRES_CONNECTION`)
} as const

export type MongoConnectionName = (typeof MongoConnectionName)[keyof typeof MongoConnectionName]
