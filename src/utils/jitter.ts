/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/utils/jitter.md
 */
import { InputValidator, SchemaInfer } from './validator'

export const JITTER_DEFAULT_PERCENTAGE = 0.1

export const JitterApplySchema = InputValidator.object({
  base: InputValidator.number(),
  percentage: InputValidator.number().optional(),
  options: InputValidator.object({
    min: InputValidator.number().optional(),
    max: InputValidator.number().optional(),
    integer: InputValidator.boolean().optional()
  }).optional()
})

export class JitterUtils {
  static apply({ base, percentage = JITTER_DEFAULT_PERCENTAGE, options }: JitterApplyOptionsInput): number {
    if (base <= 0) return base

    const value = JitterUtils.randomBetween(base, percentage)
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

export type JitterApplyOptionsInput = SchemaInfer<typeof JitterApplySchema>
