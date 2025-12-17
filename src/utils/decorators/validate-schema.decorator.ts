/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/decorators/validate-schema.md
 */
import zod from 'zod'

import { ApiBadRequestException } from '../exception'

interface ValidationErrorResult {
  error: zod.ZodError | null
  issues: zod.core.$ZodIssue[]
}

export function ValidateSchema(...schemas: zod.Schema[]) {
  return (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value

    descriptor.value = function (...args: unknown[]) {
      const validationResult: ValidationErrorResult = {
        issues: [],
        error: null
      }

      schemas.forEach((schema, index) => {
        if (index >= args.length) {
          return
        }

        try {
          const validatedData = schema.parse(args[`${index}`]) as Record<string, unknown>

          const cleanedData = Object.keys(validatedData).reduce(
            (acc, key) => {
              if (validatedData[`${key}`] !== undefined) {
                acc[`${key}`] = validatedData[`${key}`]
              }
              return acc
            },
            {} as Record<string, unknown>
          )

          args[`${index}`] = cleanedData
        } catch (error) {
          if (error instanceof zod.ZodError) {
            if (!validationResult.error) {
              validationResult.error = error
            }

            validationResult.issues.push(...error.issues)
          } else {
            const zodError = new zod.ZodError([
              {
                code: 'custom',
                message: 'Error during validation not treated',
                path: [`${index}`]
              }
            ])

            if (!validationResult.error) {
              validationResult.error = zodError
            }
            validationResult.issues.push(...zodError.issues)
          }
        }
      })

      if (validationResult.error) {
        const messages = validationResult.issues.map((issue) => {
          const path = issue.path.length ? issue.path.join('.') : 'input'
          return `${path}: ${issue.message}`
        })

        throw new ApiBadRequestException(messages.join(', '), {
          context: 'ValidateSchema',
          stack: validationResult.error.stack,
          details: validationResult.issues
        })
      }

      return originalMethod.apply(this, args)
    }
  }
}
