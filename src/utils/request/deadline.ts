/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/utils/deadline.md
 */
import { AsyncContext } from '../async-context'
import { ApiBadRequestException } from '../exception'

export const REQUEST_DEADLINE_HEADER = 'x-request-deadline' as const

export class Deadline implements RequestDeadline {
  constructor(public readonly expiresAt: number) {}

  static fromTimeout(timeoutMs: number): Deadline {
    return new Deadline(Date.now() + timeoutMs)
  }

  static fromHeader(value: string | string[] | undefined): Deadline | undefined {
    if (value === undefined) return undefined

    if (typeof value !== 'string' || !/^\d+$/.test(value)) {
      throw new ApiBadRequestException(`Invalid ${REQUEST_DEADLINE_HEADER} header`)
    }

    const expiresAt = Number(value)

    if (!Number.isSafeInteger(expiresAt) || expiresAt <= 0) {
      throw new ApiBadRequestException(`Invalid ${REQUEST_DEADLINE_HEADER} header`)
    }

    return new Deadline(expiresAt)
  }

  remainingMs(): number {
    return Math.max(0, this.expiresAt - Date.now())
  }

  hasExpired(): boolean {
    return this.remainingMs() === 0
  }

  getTimeoutMs(maximumMs: number): number {
    return Math.min(this.remainingMs(), maximumMs)
  }
}

const deadlineContext = new AsyncContext<Deadline>()

export const runWithDeadline = <T>(deadline: Deadline, callback: () => T): T => {
  return deadlineContext.run(deadline, callback)
}

export const getCurrentDeadline = (): Deadline | undefined => {
  return deadlineContext.getCurrent()
}

export type RequestDeadline = {
  readonly expiresAt: number
  remainingMs(): number
  hasExpired(): boolean
  getTimeoutMs(maximumMs: number): number
}
