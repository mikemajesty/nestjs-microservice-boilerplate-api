import { Connection, Types } from 'mongoose'

export class MongoUtils {
  static createObjectId = (id?: string): Types.ObjectId => {
    return new Types.ObjectId(id)
  }

  static isObjectId = (id?: string) => {
    if (id) {
      return Types.ObjectId.isValid(id)
    }
    return false
  }

  static escapeParentheses = (filter: string | string[]): string | string[] => {
    if (typeof filter === 'string') {
      return filter?.replace('(', '\\(')?.replace(')', '\\)')
    }
    if (typeof filter === 'object') {
      return filter.map((f) => f.replace('(', '\\(')?.replace(')', '\\)'))
    }

    return filter
  }

  static calculateSkip = (page: number, limit: number): number => {
    return ((page || 1) - 1) * Number(limit || 10)
  }

  static diacriticSensitiveRegex = (filter: string | string[]): string | string[] => {
    const handlerFilter = (innerFilter: string) => {
      return innerFilter
        .replace(/a/g, '[a,á,à,ä,â,ã]')
        .replace(/e/g, '[e,é,ë,è,ê]')
        .replace(/i/g, '[i,í,ï,ì,î]')
        .replace(/o/g, '[o,ó,ö,ò,ô]')
        .replace(/c/g, '[c,ç]')
        .replace(/u/g, '[u,ü,ú,ù]')
    }

    if (typeof filter === 'string') {
      return handlerFilter(filter)
    }
    if (typeof filter === 'object') {
      const regexText = filter.map((f) => {
        return handlerFilter(f)
      })

      return regexText
    }

    return filter
  }

  static createRegexFilterText = (text: string | string[]): string | string[] => {
    return this.diacriticSensitiveRegex(this.escapeParentheses(text))
  }

  static toObjectId = (id: string | Types.ObjectId): Types.ObjectId => {
    return typeof id === 'string' ? new Types.ObjectId(id) : id
  }

  static toObjectIdArray = (ids: (string | Types.ObjectId)[]): Types.ObjectId[] => {
    return ids.map((id) => this.toObjectId(id))
  }
}

export type MongoRepositoryModelSessionType<T> = T & { connection?: Connection }

export type MongoSession = {
  abortTransaction: () => Promise<void>
  commitTransaction: () => Promise<void>
  endSession: () => void
}

type MongoOperators<T> = {
  $eq?: T
  $ne?: T
  $in?: T[]
  $nin?: T[]
  $gt?: T
  $gte?: T
  $lt?: T
  $lte?: T
}

export type FieldQuery<T> = T | MongoOperators<T>

export type FilterQuery<T> = {
  [K in keyof T]?: T[K] extends object ? FilterQuery<T[K]> | FieldQuery<T[K]> : FieldQuery<T[K]>
} & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}
