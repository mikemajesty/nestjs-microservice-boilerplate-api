/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/utils/deadline.md
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/tests/standards.md
 */

import { TestUtils } from '@/utils/test/utils'

import { Deadline, getCurrentDeadline, runWithDeadline } from '../request/deadline'

describe(Deadline.name, () => {
  afterEach(() => {
    TestUtils.restoreMocks()
  })

  describe('fromTimeout', () => {
    it('should create a deadline that expires timeoutMs in the future', () => {
      const now = 1_000_000
      TestUtils.spyOn(Date, 'now').mockReturnValue(now)

      const deadline = Deadline.fromTimeout(5000)

      expect(deadline.expiresAt).toBe(now + 5000)
    })
  })

  describe('fromHeader', () => {
    it('should parse an epoch-millisecond deadline header', () => {
      expect(Deadline.fromHeader('2000000')?.expiresAt).toBe(2_000_000)
    })

    it('should return undefined when the deadline header is absent', () => {
      expect(Deadline.fromHeader(undefined)).toBeUndefined()
    })

    it.each(['', 'abc', '1.5', '-1', '9007199254740992', ['1000', '2000']])(
      'should reject an invalid deadline header: %p',
      (value) => {
        expect(() => Deadline.fromHeader(value)).toThrow('Invalid x-request-deadline header')
      }
    )
  })

  describe('remainingMs', () => {
    it('should return the time left before expiresAt', () => {
      const now = 1_000_000
      TestUtils.spyOn(Date, 'now').mockReturnValue(now)

      const deadline = new Deadline(now + 3000)

      expect(deadline.remainingMs()).toBe(3000)
    })

    it('should never return a negative value once expiresAt is in the past', () => {
      const now = 1_000_000
      TestUtils.spyOn(Date, 'now').mockReturnValue(now)

      const deadline = new Deadline(now - 3000)

      expect(deadline.remainingMs()).toBe(0)
    })
  })

  describe('hasExpired', () => {
    it('should return false while there is time remaining', () => {
      const now = 1_000_000
      TestUtils.spyOn(Date, 'now').mockReturnValue(now)

      const deadline = new Deadline(now + 1)

      expect(deadline.hasExpired()).toBe(false)
    })

    it('should return true once remainingMs reaches zero', () => {
      const now = 1_000_000
      TestUtils.spyOn(Date, 'now').mockReturnValue(now)

      const deadline = new Deadline(now)

      expect(deadline.hasExpired()).toBe(true)
    })
  })

  describe('getTimeoutMs', () => {
    it('should return the remaining time when it is lower than the maximum', () => {
      const now = 1_000_000
      TestUtils.spyOn(Date, 'now').mockReturnValue(now)

      const deadline = new Deadline(now + 1000)

      expect(deadline.getTimeoutMs(5000)).toBe(1000)
    })

    it('should return the maximum when the remaining time is higher than it', () => {
      const now = 1_000_000
      TestUtils.spyOn(Date, 'now').mockReturnValue(now)

      const deadline = new Deadline(now + 10_000)

      expect(deadline.getTimeoutMs(5000)).toBe(5000)
    })

    it('should never return more than the remaining time, even with a large maximum', () => {
      const now = 1_000_000
      TestUtils.spyOn(Date, 'now').mockReturnValue(now)

      const deadline = new Deadline(now + 200)

      expect(deadline.getTimeoutMs(Number.MAX_SAFE_INTEGER)).toBe(200)
    })
  })
})

describe(getCurrentDeadline.name, () => {
  it('should return undefined when called outside of runWithDeadline', () => {
    expect(getCurrentDeadline()).toBeUndefined()
  })
})

describe(runWithDeadline.name, () => {
  it('should expose the deadline to getCurrentDeadline within the callback', () => {
    const deadline = Deadline.fromTimeout(1000)

    const result = runWithDeadline(deadline, () => {
      return getCurrentDeadline()
    })

    expect(result).toBe(deadline)
  })

  it('should not leak the deadline outside of the callback', () => {
    const deadline = Deadline.fromTimeout(1000)

    runWithDeadline(deadline, () => undefined)

    expect(getCurrentDeadline()).toBeUndefined()
  })

  it('should isolate deadlines across concurrent async executions', async () => {
    const outerDeadline = Deadline.fromTimeout(1000)
    const innerDeadline = Deadline.fromTimeout(2000)

    const results = await Promise.all([
      runWithDeadline(outerDeadline, async () => {
        await new Promise((resolve) => setTimeout(resolve, 20))
        return getCurrentDeadline()
      }),
      runWithDeadline(innerDeadline, async () => {
        await new Promise((resolve) => setTimeout(resolve, 5))
        return getCurrentDeadline()
      })
    ])

    expect(results[0]).toBe(outerDeadline)
    expect(results[1]).toBe(innerDeadline)
  })

  it('should return the callback return value', () => {
    const deadline = Deadline.fromTimeout(1000)

    const result = runWithDeadline(deadline, () => 'ok')

    expect(result).toBe('ok')
  })
})
