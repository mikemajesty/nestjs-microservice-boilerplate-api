/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/utils/collection.md
 */
import { ApiInternalServerException } from './exception'
import { SortEnum } from './sort'

type NumericInput = number | string
type SortableValue = string | number | Date | null | undefined

const toFiniteNumber = (value: unknown, property: string): number => {
  const number = Number(value)

  if (!Number.isFinite(number)) {
    throw new ApiInternalServerException(`Property "${property}" must be numeric`)
  }

  return number
}

const toSortableValue = (value: unknown, property: string): Exclude<SortableValue, null | undefined> => {
  if (typeof value === 'string' || typeof value === 'number' || value instanceof Date) {
    return value
  }

  throw new ApiInternalServerException(`Property "${property}" must be sortable`)
}

const compareSortableValues = (
  a: Exclude<SortableValue, null | undefined>,
  b: Exclude<SortableValue, null | undefined>
) => {
  const left = a instanceof Date ? a.getTime() : a
  const right = b instanceof Date ? b.getTime() : b

  if (left === right) return 0
  return left < right ? -1 : 1
}

export class CollectionUtil {
  static groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
    return (arr || []).reduce(
      (acc, item) => {
        const k = String(item[key] ?? 'null')
        acc[k] ??= []
        acc[k].push(item)
        return acc
      },
      {} as Record<string, T[]>
    )
  }

  static maxBy<T>(arr: T[], key: keyof T): T | null {
    if (!arr?.length) return null

    const property = String(key)

    return arr.reduce((a, b) => (toFiniteNumber(a[key], property) > toFiniteNumber(b[key], property) ? a : b))
  }

  static minBy<T>(arr: T[], key: keyof T): T | null {
    if (!arr?.length) return null

    const property = String(key)

    return arr.reduce((a, b) => (toFiniteNumber(a[key], property) < toFiniteNumber(b[key], property) ? a : b))
  }

  static max(arr: NumericInput[]): number {
    const nums = (arr || []).map((n) => toFiniteNumber(n, 'value'))
    return nums.length ? Math.max(...nums) : NaN
  }

  static min(arr: NumericInput[]): number {
    const nums = (arr || []).map((n) => toFiniteNumber(n, 'value'))
    return nums.length ? Math.min(...nums) : NaN
  }

  static sum(arr: NumericInput[]): number {
    return (arr || []).reduce<number>((s, n) => s + toFiniteNumber(n, 'value'), 0)
  }

  static sumBy<T>(arr: T[], key: keyof T): number {
    const property = String(key)

    return (arr || []).reduce((s, item) => {
      return s + toFiniteNumber(item[key], property)
    }, 0)
  }

  static hasDuplicated<T>(arr: T[]): boolean {
    return new Set(arr || []).size !== (arr?.length || 0)
  }

  static chunk<T>(arr: T[], size: number): T[][] {
    if (size <= 0) throw new ApiInternalServerException('Size must be > 0')

    return (arr || []).reduce((chunks, _, i) => {
      if (i % size === 0) chunks.push(arr.slice(i, i + size))
      return chunks
    }, [] as T[][])
  }

  static sortNullLast<T>(arr: T[], key: keyof T, sort: SortEnum = SortEnum.asc): T[] {
    const property = String(key)

    return [...(arr || [])].sort((a, b) => {
      const av = a[key] ?? null
      const bv = b[key] ?? null

      if (av === bv) return 0
      if (av === null) return 1
      if (bv === null) return -1

      const comparison = compareSortableValues(
        toSortableValue(av, property),
        toSortableValue(bv, property)
      )
      return sort === SortEnum.asc ? comparison : comparison * -1
    })
  }

  static isEmpty<T>(arr: T[] | null | undefined): boolean {
    return !arr?.length
  }
}
