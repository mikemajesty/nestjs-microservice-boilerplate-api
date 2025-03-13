import { ZodOptional, ZodPipeline, ZodType } from 'zod';

type Equals<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? true : false;

type NonUndefined<T> = Exclude<T, undefined>;

export type ZodInferSchema<T extends object> = {
  [Key in keyof T]-?: Equals<T[Key], NonUndefined<T[Key]>> extends false
    ? ZodOptional<ZodType<NonNullable<T[Key]>>> | ZodPipeline<ZodOptional<ZodType<unknown>>, ZodType<T[Key]>>
    : ZodType<T[Key]> | ZodPipeline<ZodType<unknown>, ZodType<T[Key]>>;
};

export type MakePartial<T> = {
  [P in keyof T]: T[P] extends object ? MakePartial<T[P]> : T[P];
};
