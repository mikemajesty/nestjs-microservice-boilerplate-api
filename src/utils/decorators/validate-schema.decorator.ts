/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/decorators/validate-schema.md
 */

import { ApiBadRequestException } from '../exception'
import { BaseZodType, ZodExceptionIssue } from '../validator'

export function ValidateSchema(...schemas: BaseZodType[]) {
  if (schemas?.length === 0 || !schemas) {
    throw new ApiBadRequestException('At least one schema must be provided')
  }

  return (target: object, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value

    descriptor.value = function (...args: unknown[]) {
      const errors: ZodExceptionIssue[] = []

      schemas.forEach((schema, index) => {
        if (index >= args.length) return

        try {
          const validatedData = schema.parse(args[index]) as Record<string, unknown>

          const cleanedData = Object.keys(validatedData).reduce(
            (acc, key) => {
              if (validatedData[key] !== undefined) {
                acc[key] = validatedData[key]
              }
              return acc
            },
            {} as Record<string, unknown>
          )

          args[index] = cleanedData
        } catch (error) {
          errors.push(...(error as { issues: ZodExceptionIssue[] }).issues)
        }
      })

      if (errors.length > 0) {
        const messages = errors.map((issue, index) => {
          const path = issue.path.length ? issue.path.join('.') : `input[${index}]`
          return `${path}: ${issue.message}`
        })

        throw new ApiBadRequestException(messages.join(', '), {
          context: target.constructor.name ?? 'ValidateSchema',
          details: errors
        })
      }

      return originalMethod.apply(this, args)
    }
  }
}
