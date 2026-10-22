/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/infra/timeout-budget.md
 */
import { config } from 'dotenv'

import { ApiInternalServerException } from '@/utils/exception'
import { RequestDeadline } from '@/utils/request/deadline'

import { SecretsSchema } from '../../infra/secrets/schema'

config()

export class TimeoutBudget {
  private static readonly DEPENDENCY_SAFETY_MARGIN_MS = 1000

  static readonly HTTP_REQUEST_TIMEOUT_MS = TimeoutBudget.resolveHttpRequestTimeoutMs()

  static readonly DEPENDENCY_TIMEOUT_MS = TimeoutBudget.resolveDependencyTimeoutMs()

  private static resolveHttpRequestTimeoutMs(): number {
    const schema = SecretsSchema().pick({
      HTTP_REQUEST_TIMEOUT_MS: true
    })

    const { HTTP_REQUEST_TIMEOUT_MS } = schema.parse({
      HTTP_REQUEST_TIMEOUT_MS: process.env.HTTP_REQUEST_TIMEOUT_MS
    })

    return HTTP_REQUEST_TIMEOUT_MS
  }

  private static resolveDependencyTimeoutMs(): number {
    const dependencyTimeoutMs = Math.max(
      TimeoutBudget.HTTP_REQUEST_TIMEOUT_MS - TimeoutBudget.DEPENDENCY_SAFETY_MARGIN_MS,
      1000
    )

    if (dependencyTimeoutMs >= TimeoutBudget.HTTP_REQUEST_TIMEOUT_MS) {
      throw new ApiInternalServerException(
        `timeout-budget: DEPENDENCY_TIMEOUT_MS (${dependencyTimeoutMs}) must be lower than HTTP_REQUEST_TIMEOUT_MS (${TimeoutBudget.HTTP_REQUEST_TIMEOUT_MS}). ` +
          'adjust HTTP_REQUEST_TIMEOUT_MS or DEPENDENCY_SAFETY_MARGIN_MS.'
      )
    }

    return dependencyTimeoutMs
  }

  /**
   * Resolves the effective timeout for an outbound dependency (HTTP retry/timeout, etc).
   * When a `RequestDeadline` is provided (there is an inbound HTTP request in progress),
   * returns the lower value between its remaining time and `DEPENDENCY_TIMEOUT_MS` — a
   * dependency can only ever get less time than the ceiling, never more. Falls back to
   * `DEPENDENCY_TIMEOUT_MS` when there's no deadline in context (e.g. jobs/cron/scripts).
   */
  static getDependencyTimeoutMs(deadline?: RequestDeadline): number {
    if (!deadline) return TimeoutBudget.DEPENDENCY_TIMEOUT_MS

    return deadline.getTimeoutMs(TimeoutBudget.DEPENDENCY_TIMEOUT_MS)
  }
}
