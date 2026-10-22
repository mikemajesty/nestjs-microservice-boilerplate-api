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

export const getCurrentRequestContext = (): RequestContext | undefined => {
  return requestContext.getCurrent()
}
