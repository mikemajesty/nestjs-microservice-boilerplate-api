/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/tests/standards.md
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/decorators/with-error-context.md
 */

import { ApiInternalServerException, BaseException } from '@/utils/exception'
import { TestUtils } from '@/utils/test/utils'

import { WithErrorContext } from '../with-error-context.decorator'

describe(WithErrorContext.name, () => {
  afterEach(() => {
    TestUtils.restoreMocks()
    TestUtils.clearMocks()
  })

  it('should map an error and add the declaring method context to the mapped error', async () => {
    const cause = new Error('database connection failed')
    const map = TestUtils.mockImplementation<ApiDatabaseException>((error: unknown) => {
      const cause = error instanceof Error ? error : new Error(String(error))
      return new ApiDatabaseException(cause.message, { cause })
    })

    class TestRepository {
      @WithErrorContext({ map })
      async find(): Promise<never> {
        throw cause
      }
    }

    await expect(new TestRepository().find()).rejects.toMatchObject({
      name: 'ApiDatabaseException',
      message: cause.message,
      context: 'TestRepository.find',
      cause
    })
    expect(map).toHaveBeenCalledTimes(1)
    expect(map).toHaveBeenCalledWith(cause)
  })

  it('should preserve a context provided by the mapped error', async () => {
    const mappedError = new ApiInternalServerException('mapped error', { context: 'Database.query' })

    class TestService {
      @WithErrorContext({ map: () => mappedError })
      async execute(): Promise<never> {
        throw new Error('original error')
      }
    }

    await expect(new TestService().execute()).rejects.toBe(mappedError)
  })

  it('should preserve the original error and add context when no mapper is provided', async () => {
    const error = new Error('operation failed')

    class TestService {
      @WithErrorContext()
      async execute(): Promise<never> {
        throw error
      }
    }

    await expect(new TestService().execute()).rejects.toBe(error)
    expect(error).toHaveProperty('context', 'TestService.execute')
  })
})

class ApiDatabaseException extends BaseException {
  constructor(message: string, metadata: { cause: Error }) {
    super(message, 500, metadata)
  }
}
