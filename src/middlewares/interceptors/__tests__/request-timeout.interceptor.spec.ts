/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/middlewares/request-timeout.interceptor.md
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/tests/standards.md
 */

import { CallHandler, ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { EMPTY, firstValueFrom, Observable } from 'rxjs'

import { ApiBadRequestException, ApiTimeoutException } from '@/utils/exception'
import { getCurrentDeadline } from '@/utils/request/deadline'
import { TimeoutBudget } from '@/utils/request/timeout-budget'
import { TestUtils } from '@/utils/test/utils'

import { RequestTimeoutInterceptor } from '../request-timeout.interceptor'

const createExecutionContext = (deadlineHeader?: string) =>
  ({
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ headers: { 'x-request-deadline': deadlineHeader } })
    })
  }) as unknown as ExecutionContext

describe(RequestTimeoutInterceptor.name, () => {
  const getAllAndOverride = TestUtils.mockReturnValue<number | undefined>()
  const reflector = { getAllAndOverride } as unknown as Reflector
  let activeDeadline: number | undefined
  const handler: CallHandler = {
    handle: () =>
      new Observable<void>((subscriber) => {
        activeDeadline = getCurrentDeadline()?.expiresAt
        subscriber.next()
        subscriber.complete()
      })
  }
  let interceptor: RequestTimeoutInterceptor

  beforeEach(() => {
    getAllAndOverride.mockReturnValue(undefined)
    interceptor = new RequestTimeoutInterceptor(reflector)
    activeDeadline = undefined
  })

  afterEach(() => {
    TestUtils.restoreMocks()
    TestUtils.clearMocks()
  })

  it('should use the upstream deadline when it shortens the local route timeout', async () => {
    const now = 1_000_000
    TestUtils.spyOn(Date, 'now').mockReturnValue(now)
    getAllAndOverride.mockReturnValue(5000)

    await firstValueFrom(interceptor.intercept(createExecutionContext(String(now + 1000)), handler))

    expect(activeDeadline).toBe(now + 1000)
  })

  it('should not let the upstream deadline extend the local timeout', async () => {
    const now = 1_000_000
    TestUtils.spyOn(Date, 'now').mockReturnValue(now)
    getAllAndOverride.mockReturnValue(5000)

    await firstValueFrom(interceptor.intercept(createExecutionContext(String(now + 10_000)), handler))

    expect(activeDeadline).toBe(now + 5000)
  })

  it('should use the configured default when no route timeout is defined', async () => {
    const now = 1_000_000
    TestUtils.spyOn(Date, 'now').mockReturnValue(now)

    await firstValueFrom(interceptor.intercept(createExecutionContext(), handler))

    expect(activeDeadline).toBe(now + TimeoutBudget.HTTP_REQUEST_TIMEOUT_MS)
  })

  it('should reject malformed deadlines', () => {
    expect(() => interceptor.intercept(createExecutionContext('not-a-timestamp'), handler)).toThrow(
      ApiBadRequestException
    )
  })

  it('should reject expired deadlines before running the handler', () => {
    const now = 1_000_000
    TestUtils.spyOn(Date, 'now').mockReturnValue(now)
    const handle = TestUtils.mockReturnValue<Observable<unknown>>(EMPTY)

    expect(() => interceptor.intercept(createExecutionContext(String(now)), { handle })).toThrow(ApiTimeoutException)
    expect(handle).not.toHaveBeenCalled()
  })
})
