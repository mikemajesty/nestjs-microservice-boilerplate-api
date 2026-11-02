/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/utils/object.md
 */
import { AnyFunction, AnyType } from './types'

export class ObjectUtils {
  /**
   * Returns a property name while checking it against `T` at compile time. Use the
   * instance type for instance properties and `typeof Class` for static properties.
   *
   * TypeScript types are erased at runtime, so the property name must be supplied.
   */
  static nameOf<T>(name: Extract<keyof T, string>): Extract<keyof T, string> {
    return name
  }

  /**
   * Reads a nested property path without throwing when an intermediate value is nullish.
   * Centralizes optional-chain handling in one helper, avoiding repeated nullish checks
   * and branch-coverage cases at every call site that reads a complex object.
   *
   * The selector is evaluated against a proxy to capture a simple chain of property
   * accesses. Keep it to property access only; do not use conditions, method calls,
   * arithmetic, or computed expressions in the selector.
   *
   * Test nullish-path behavior in this helper's tests rather than duplicating those
   * defensive-path tests at each usage. Returns `defaultValue` when the object or
   * resolved value is `null` or `undefined`.
   *
   * @example
   * ```ts
   * ObjectUtils.reach(error, (e) => e.response.data.message, 'Unknown error')
   * ```
   */
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

  /** Returns the first value that is neither `null` nor `undefined`. */
  static firstDefined<T>(...values: (T | null | undefined)[]): T | undefined {
    return values.find((v) => v !== null && v !== undefined) as T | undefined
  }

  /**
   * Creates a deep clone using the platform `structuredClone` algorithm.
   *
   * Values unsupported by `structuredClone` (such as functions) throw a
   * `DataCloneError`; custom class prototypes are not preserved.
   */
  static clone<T>(obj: T): T {
    return globalThis.structuredClone(obj)
  }

  /** Checks whether a value is an object literal or a null-prototype object. */
  static isPlainObject(value: unknown): value is Record<string, unknown> {
    if (value === null || typeof value !== 'object') return false

    const prototype = Object.getPrototypeOf(value)
    return prototype === Object.prototype || prototype === null
  }

  /**
   * Copies enumerable own properties from each source into `target`, in order.
   *
   * This is a shallow, mutating merge: later sources overwrite earlier values.
   * Nullish sources and prototype-sensitive keys are ignored.
   */
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
