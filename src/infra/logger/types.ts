import { IncomingHttpHeaders, IncomingMessage, ServerResponse } from 'node:http'

import { HttpLogger, Options, ReqId } from 'pino-http'

import { BaseException } from '@/utils/exception'
import { AnyType } from '@/utils/types'

export type MessageInputType = {
  message: string
  context?: string
  obj?: AnyType & { context?: string }
}

export type ErrorType = Error & BaseException

export type AppLoggerRequest = IncomingMessage & {
  id: ReqId
  context?: string
  protocol?: string
  headers: IncomingHttpHeaders & { traceid?: string | string[] }
}

export type AppLoggerResponse = ServerResponse<IncomingMessage>

export type AppHttpLogger = HttpLogger<AppLoggerRequest, AppLoggerResponse>

export type AppHttpLoggerOptions = Options<AppLoggerRequest, AppLoggerResponse>

export enum LogLevelEnum {
  fatal = 'fatal',
  error = 'error',
  warn = 'warn',
  info = 'info',
  debug = 'debug',
  trace = 'trace',
  silent = 'silent'
}
