/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/utils/deadline.md
 */
import { AsyncContext } from '../async-context'

export class Deadline implements RequestDeadline {
  constructor(public readonly expiresAt: number) {}

  static fromTimeout(timeoutMs: number): Deadline {
    return new Deadline(Date.now() + timeoutMs)
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
