/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/decorators/request-timeout.md
 */
import { CustomDecorator, SetMetadata } from '@nestjs/common'

import { ApiUnprocessableEntityException } from '../exception'

export const REQUEST_TIMEOUT_METADATA_KEY = 'request-timeout'

/**
 * Overrides the global HTTP request timeout for a single route.
 *
 * ⚠️ This only extends how long the HTTP response waits — it does NOT extend
 * any database timeout. Postgres keeps a fixed, global `statement_timeout`
 * (derived from `DEPENDENCY_TIMEOUT_MS`) regardless of this decorator. Mongo
 * also keeps a fixed, global `socketTimeoutMS` with no per-call override
 * available today.
 *
 * If the route runs a long Postgres operation, you must also extend the
 * DB-side timeout explicitly via `UserRepository.withDeadline(timeoutMs, fn)`
 * (see {@link UserRepository.withDeadline}), using a value with a safety
 * margin below the value passed here. Otherwise the query is still cut short
 * by the shorter global timeout, making this decorator useless on its own.
 *
 * @example
 * ```typescript
 * @Post('heavy-report')
 * @RequestTimeout(30000)
 * async generateReport() {
 *   return this.userRepository.withDeadline(28000, (repository) => repository.find(...))
 * }
 * ```
 *
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/decorators/request-timeout.md
 */
export const RequestTimeout = (milliseconds: number): CustomDecorator<string> => {
  if (!Number.isInteger(milliseconds) || milliseconds <= 0) {
    throw new ApiUnprocessableEntityException('Request timeout must be a positive integer in milliseconds')
  }

  return SetMetadata(REQUEST_TIMEOUT_METADATA_KEY, milliseconds)
}
