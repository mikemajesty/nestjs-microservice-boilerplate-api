/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/utils/request-context.md
 */
import { AsyncContext } from '../async-context'
import { TraceIdField } from './index'

export type RequestContext = Readonly<TraceIdField> & {
  readonly authorization?: string
}

const requestContext = new AsyncContext<RequestContext>()

export const runWithRequestContext = <T>(context: RequestContext, callback: () => T): T => {
  return requestContext.run(context, callback)
}

/**
 * Runs a background task (for example, a NestJS cron handler) with its own traceId.
 * AsyncLocalStorage keeps concurrent task executions isolated. This does not acquire a
 * distributed lock or prevent duplicate executions; use a lock separately when needed.
 */
export const runWithTraceId = <T>(traceId: string, callback: () => T): T => {
  const context = getCurrentRequestContext()

  return runWithRequestContext({ ...context, traceid: traceId }, callback)
}

export const getCurrentRequestContext = (): RequestContext | undefined => {
  return requestContext.getCurrent()
}
