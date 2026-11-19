import { IDGeneratorUtils } from '@/utils/id-generator'

import { EnvEnum } from '../secrets/types'

const createConnectionName = (name: string) => {
  if (process.env.NODE_ENV === EnvEnum.TEST) {
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
