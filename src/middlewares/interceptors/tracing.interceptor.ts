/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/middlewares/tracing.interceptor.md
 */
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import opentelemetry, {
  Attributes,
  AttributeValue,
  Context,
  SpanStatus,
  SpanStatusCode,
  TimeInput,
  Tracer
} from '@opentelemetry/api'
import { Observable, tap } from 'rxjs'

import { AppFastifyRequest, generalizePath, TRACEID_HEADER, TracingType } from '@/utils/request'
import { runWithRequestContext } from '@/utils/request/context'

import { name, version } from '../../../package.json'

@Injectable()
export class TracingInterceptor implements NestInterceptor {
  private tracer: Tracer

  constructor() {
    this.tracer = opentelemetry.trace.getTracer(name, version)
  }

  intercept(executionContext: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = executionContext.switchToHttp().getRequest<AppFastifyRequest>()
    const res = executionContext.switchToHttp().getResponse()

    const requestId = request.headers[TRACEID_HEADER] ?? request.id

    const controller = `${executionContext.getClass().name}.${executionContext.getHandler().name}`
    const requestPath = request.url.split('?')[0]

    const span = this.tracer.startSpan(generalizePath(requestPath))

    const createTracingInstance = (): TracingType => {
      return {
        span,
        tracer: this.tracer,
        [TRACEID_HEADER]: requestId,
        setStatus: (status: SpanStatus) => {
          span.setStatus(status)
        },
        logEvent: (key, value) => {
          span.addEvent(key, value as Attributes | TimeInput)
        },
        addAttribute: (key: string, value: AttributeValue) => {
          span.setAttribute(key, value)
        },
        finish: () => {
          span.end()
        },
        createSpan: (name, parent?: Context) => {
          return this.tracer.startSpan(name, { root: false }, parent)
        }
      }
    }

    request.tracing = createTracingInstance()

    request.tracing.addAttribute('http.method', request.method)
    request.tracing.addAttribute('http.url', requestPath)
    request.tracing.addAttribute('context', controller)

    if (requestId) {
      request.tracing.addAttribute(TRACEID_HEADER, requestId)
    }

    const requestContext = { [TRACEID_HEADER]: requestId, authorization: request.headers.authorization }

    return runWithRequestContext(requestContext, () => next.handle()).pipe(
      tap(() => {
        if (request?.tracing) {
          request.tracing.setStatus({ code: SpanStatusCode.OK })
          request.tracing.addAttribute('http.status_code', res.statusCode)
          request.tracing.finish()
        }
      })
    )
  }
}
