import { AnyFunction, AnyType } from './types'

export class ObjectUtils {
  static reach<T extends object, R>(
    obj: T | null | undefined,
    selector: (obj: DeepRequired<T>) => NotFunction<R>,
    defaultValue: NotFunction<Partial<R>> | NotFunction<R>
  ): NotFunction<R>
  static reach<T extends object, R>(
    obj: T | null | undefined,
    selector: (obj: DeepRequired<T>) => NotFunction<R>
  ): NotFunction<R> | undefined
  static reach<T extends object, R>(
    obj: T | null | undefined,
    selector: (obj: DeepRequired<T>) => NotFunction<R>,
    defaultValue?: NotFunction<Partial<R>> | NotFunction<R>
  ): NotFunction<R> | undefined {
    if (obj == null) return defaultValue as NotFunction<R> | undefined
    const path: string[] = []
    const proxy: T = new Proxy({} as T, {
      get(_, key) {
        if (typeof key === 'string') path.push(key)
        return proxy
      }
    })
    selector(proxy as DeepRequired<T>)
    const result = path.reduce((acc: AnyType, key) => acc?.[`${key}`], obj) as NotFunction<R> | undefined
    return result ?? (defaultValue as NotFunction<R> | undefined)
  }

  static firstDefined<T>(...values: (T | null | undefined)[]): T | undefined {
    return values.find((v) => v !== null && v !== undefined) as T | undefined
  }

  static clone<T>(obj: T): T {
    return globalThis.structuredClone(obj)
  }

  static isPlainObject(value: unknown): value is Record<string, unknown> {
    if (value === null || typeof value !== 'object') return false

    const prototype = Object.getPrototypeOf(value)
    return prototype === Object.prototype || prototype === null
  }

  static mergeShallow<T extends object>(target: T, ...sources: T[]): T {
    for (const source of sources) {
      if (source == null || typeof source !== 'object') continue

      for (const key of Object.keys(source)) {
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue
        ;(target as Record<string, unknown>)[key] = source[key as keyof typeof source]
      }
    }
    return target
  }
}

type NotFunction<R> = R extends AnyFunction ? never : R

type DeepRequired<T> = {
  [K in keyof T]-?: NonNullable<T[K]> extends object ? DeepRequired<NonNullable<T[K]>> : NonNullable<T[K]>
}
