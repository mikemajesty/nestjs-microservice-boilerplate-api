/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/tests/standards.md
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/infra/repository.md
 */

import { ApiBadRequestException } from '@/utils/exception'

import { ApiDatabaseException, WithDatabaseErrorContext } from '../util'

describe(WithDatabaseErrorContext.name, () => {
  it('should map unknown errors to database exceptions with method context and original cause', async () => {
    const cause = new Error('connection failed')

    class TestRepository {
      @WithDatabaseErrorContext
      async find(): Promise<never> {
        throw cause
      }
    }

    await expect(new TestRepository().find()).rejects.toMatchObject({
      name: ApiDatabaseException.name,
      message: cause.message,
      context: 'TestRepository.find',
      cause
    })
  })

  it('should preserve application exceptions and add method context', async () => {
    const exception = new ApiBadRequestException('invalid query')

    class TestRepository {
      @WithDatabaseErrorContext
      async find(): Promise<never> {
        throw exception
      }
    }

    await expect(new TestRepository().find()).rejects.toBe(exception)
    expect(exception.context).toBe('TestRepository.find')
  })
})
