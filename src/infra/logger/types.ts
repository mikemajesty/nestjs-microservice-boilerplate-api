import { BaseException } from '@/utils/exception'
import { AnyType } from '@/utils/types'

export type MessageInputType = {
  message: string
  context?: string
  obj?: AnyType & { context?: string }
}

export type ErrorType = Error & BaseException

export enum LogLevelEnum {
  fatal = 'fatal',
  error = 'error',
  warn = 'warn',
  info = 'info',
  debug = 'debug',
  trace = 'trace',
  silent = 'silent'
}
