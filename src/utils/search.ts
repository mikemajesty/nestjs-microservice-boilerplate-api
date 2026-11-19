/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/utils/search.md
 */
import { InferSchema, Schema } from './schema'

export type SearchInput<T> = { search: T | Partial<T> | null }

export const SearchHttpSchema = Schema.string()
  .optional()
  .refine(
    (check) => {
      if (!check) return true
      return [!check.startsWith(':'), check.includes(':')].every(Boolean)
    },
    {
      message: 'invalidSearchFormat'
    }
  )
  .refine(
    (search) => {
      if (!search) return true

      return String(search)
        .split(',')
        .every((s) => {
          const [value] = s.split(':').reverse()

          if (!value) return false
          return true
        })
    },
    {
      message: 'searchMustBe: value'
    }
  )
  .transform((searchString) => {
    if (!searchString) return null
    const search: { [key: string]: unknown } = {}

    searchString.split(',').forEach((s) => {
      const [field, value] = s.split(':')
      const finalValue = value.split('|').map((v) => v.trim())
      if (finalValue.length > 1) {
        search[`${field}`] = value.split('|').map((v) => v.trim())
        return
      }
      search[`${field}`] = value.trim()
    })

    return search
  })

export type SearchHttpSchemaInput = InferSchema<typeof SearchHttpSchema>

export const SearchSchema = Schema.object({
  search: Schema.record(Schema.string().trim(), Schema.number().or(Schema.string()).or(Schema.array(Schema.any())))
    .nullable()
    .default({})
})
