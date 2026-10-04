import { SpanStatusCode, trace } from '@opentelemetry/api'

import { AppFastifyRequest, generalizePath, UserRequest } from '@/utils/request'

import { name, version } from '../../../package.json'

export const finishTracing = (request: FastifyRequest | AppFastifyRequest, status: number, message: string) => {
  if (request?.tracing) {
    request.tracing.addAttribute('http.status_code', status)
    request.tracing.addAttribute('error.message', message)
    request.tracing.setStatus({ message, code: SpanStatusCode.ERROR })
    request.tracing.finish()
    return
  }

  const span = trace.getTracer(name, version).startSpan(generalizePath(request.url?.split('?')[0] || '/'))

  span.setAttribute('http.status_code', status)
  if (request.headers.traceid) {
    span.setAttribute('traceid', request.headers.traceid)
  }
  span.setAttribute('error.message', message)
  span.setStatus({ message, code: SpanStatusCode.ERROR })
  span.end()
}

export type FastifyRequest = AppFastifyRequest & {
  user: UserRequest
}
