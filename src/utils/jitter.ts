/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/utils/jitter.md
 */
import { ValidateSchema } from './decorators'
import { InferSchema, Schema } from './schema'

export const JITTER_DEFAULT_PERCENTAGE = 0.1

export const JitterApplySchema = Schema.object({
  base: Schema.number(),
  percentage: Schema.number().optional(),
  options: Schema.object({
    min: Schema.number().optional(),
    max: Schema.number().optional(),
    integer: Schema.boolean().optional()
  }).optional()
})

export const JitterApplyFullSchema = Schema.object({
  base: Schema.number(),
  options: Schema.object({
    min: Schema.number().optional(),
    max: Schema.number().optional(),
    integer: Schema.boolean().optional()
  }).optional()
})

export class JitterUtils {
  @ValidateSchema(JitterApplySchema)
  static apply({ base, percentage = JITTER_DEFAULT_PERCENTAGE, options }: JitterApplyOptionsInput): number {
    if (base <= 0) return base

    const value = JitterUtils.randomBetween(base, percentage)
    return JitterUtils.finalize(value, options)
  }

  @ValidateSchema(JitterApplyFullSchema)
  static applyFull({ base, options }: JitterApplyFullOptionsInput): number {
    if (base <= 0) return base

    const value = Math.random() * base
    return JitterUtils.finalize(value, options)
  }

  static applyTtl(base: number, percentage = JITTER_DEFAULT_PERCENTAGE): number {
    if (base <= 0) return 1

    return JitterUtils.apply({
      base,
      percentage,
      options: { min: 1, integer: true }
    })
  }

  private static randomBetween(base: number, percentage: number): number {
    const delta = base * percentage
    const min = base - delta
    const max = base + delta
    return min + Math.random() * (max - min)
  }

  private static finalize(value: number, options?: JitterOptions): number {
    const clamped = JitterUtils.clamp(value, options?.min, options?.max)
    return options?.integer ? Math.floor(clamped) : clamped
  }

  private static clamp(value: number, min?: number, max?: number): number {
    const lower = min ?? -Infinity
    const upper = max ?? Infinity
    return Math.min(Math.max(value, lower), upper)
  }
}

export type JitterOptions = {
  min?: number
  max?: number
  integer?: boolean
}

export type JitterApplyOptionsInput = InferSchema<typeof JitterApplySchema>
export type JitterApplyFullOptionsInput = InferSchema<typeof JitterApplyFullSchema>
