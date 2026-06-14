import { AnyType } from './types'

export class ObjectUtil {
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
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
type NotFunction<R> = R extends Function ? never : R

type DeepRequired<T> = {
  [K in keyof T]-?: NonNullable<T[K]> extends object ? DeepRequired<NonNullable<T[K]>> : NonNullable<T[K]>
}
