/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/utils/types.md
 */
import { z } from 'zod'

type Equals<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? true : false

type NonUndefined<T> = Exclude<T, undefined>

export type ZodInferSchema<T extends object> = {
  [Key in keyof T]-?: Equals<T[Key], NonUndefined<T[Key]>> extends false
    ?
        | z.ZodOptional<z.ZodType<NonNullable<T[Key]>>>
        | z.core.$ZodPipe<z.ZodOptional<z.ZodType<unknown>>, z.ZodType<T[Key]>>
    : z.ZodType<T[Key]> | z.core.$ZodPipe<z.ZodType<unknown>, z.ZodType<T[Key]>>
}

export type MakePartial<T> = {
  [P in keyof T]: T[P] extends object ? MakePartial<T[P]> : T[P]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyType = any

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export type AnyFunction = Function
