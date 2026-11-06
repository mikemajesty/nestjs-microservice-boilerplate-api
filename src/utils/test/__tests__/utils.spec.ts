/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/tests/util.md
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/tests/standards.md
 */

import { ApiBadRequestException } from '@/utils/exception'
import { InputValidator } from '@/utils/validator'

import { TestUtils } from '../utils'

describe(TestUtils.name, () => {
  describe(TestUtils.expectZodError.name, () => {
    test('when the callback throws a Zod error, should pass its issues to the assertion', async () => {
      const expected = TestUtils.mock()

      await TestUtils.expectZodError(() => InputValidator.object({ name: InputValidator.string() }).parse({}), expected)

      expect(expected).toHaveBeenCalledWith([
        {
          message: expect.any(String),
          path: 'name'
        }
      ])
    })

    test('when the callback throws a bad request with Zod issues, should pass its issues to the assertion', async () => {
      const expected = TestUtils.mock()
      const result = InputValidator.object({ name: InputValidator.string() }).safeParse({})
      if (result.success) throw new Error('Expected schema validation to fail')

      const error = new ApiBadRequestException('Validation failed', { details: result.error.issues })

      await TestUtils.expectZodError(() => Promise.reject(error), expected)

      expect(expected).toHaveBeenCalledWith([
        {
          message: expect.any(String),
          path: 'name'
        }
      ])
    })

    test('when the callback throws a different error, should rethrow it', async () => {
      const error = new Error('Unexpected failure')

      await expect(TestUtils.expectZodError(() => Promise.reject(error), TestUtils.mock())).rejects.toBe(error)
    })

    test('when the callback throws a bad request without Zod issues, should rethrow it', async () => {
      const error = new ApiBadRequestException('Bad request', { details: ['Invalid request'] })

      await expect(TestUtils.expectZodError(() => Promise.reject(error), TestUtils.mock())).rejects.toBe(error)
    })

    test('when the callback succeeds, should fail because a Zod error was expected', async () => {
      await expect(TestUtils.expectZodError(() => undefined, TestUtils.mock())).rejects.toThrow(
        'Expected callback to throw a ZodException'
      )
    })
  })
})
