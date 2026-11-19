/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/utils/sort.md
 */

import { InferSchema, Schema } from './schema'

export enum SortEnum {
  asc = 1,
  desc = -1
}

export const SortHttpSchema = Schema.string()
  .optional()
  .refine(
    (check) => {
      if (!check) return true
      return [!check.startsWith(':'), check.includes(':')].every(Boolean)
    },
    {
      message: 'invalidSortFormat'
    }
  )
  .refine(
    (sort) => {
      if (!sort) return true

      return String(sort)
        .split(',')
        .every((s) => {
          const [order] = s.split(':').reverse()
          return ['asc', 'desc'].includes(order.trim().toLowerCase() || 'asc')
        })
    },
    {
      message: 'invalidSortOrderMustBe: asc, desc'
    }
  )
  .transform((sort) => {
    const sortEntries = String(sort || 'createdAt:desc')
      .split(',')
      .map((s) => {
        const [field, order] = s.split(':')
        return [field.trim(), SortEnum[order.trim().toLowerCase() as keyof typeof SortEnum]] as const
      })

    if (!sortEntries.some(([field]) => field === 'createdAt')) {
      sortEntries.push(['createdAt', SortEnum.desc])
    }

    return Object.fromEntries(sortEntries)
  })

export const SortSchema = Schema.object({
  sort: Schema.record(Schema.string().trim().min(1), Schema.enum(SortEnum)).nullable().default({})
})

export type SortInput = InferSchema<typeof SortSchema>
