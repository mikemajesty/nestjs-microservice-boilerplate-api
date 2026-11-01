/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/infra/logger.md
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/tests/standards.md
 */

import { runWithTraceId } from '@/utils/request/context'
import { TestUtils } from '@/utils/test/utils'

import { LoggerService } from '../service'
import { AppHttpLogger } from '../types'

describe(LoggerService.name, () => {
  it('should keep traceids isolated between concurrent request logs', async () => {
    const info = TestUtils.mock()
    const logger = new LoggerService()
    logger.logger = { logger: { info } } as unknown as AppHttpLogger

    await Promise.all(
      ['trace-a', 'trace-b'].map((traceid) =>
        runWithTraceId(traceid, async () => {
          await new Promise((resolve) => setTimeout(resolve, traceid === 'trace-a' ? 10 : 0))
          logger.info({ message: traceid })
        })
      )
    )

    expect(info).toHaveBeenCalledTimes(2)
    expect(
      info.mock.calls.map(([metadata, message]) => [message, metadata.traceid])
    ).toEqual(expect.arrayContaining([['trace-a', 'trace-a'], ['trace-b', 'trace-b']]))
  })
})
