import { BaseException } from '@/utils/exception';

export type MessageType = {
  message: string;
  context?: string;
  externalApiCurl?: string;
  obj?: object;
};

export type ErrorType = Error & BaseException;

export enum LogLevelEnum {
  fatal = 'fatal',
  error = 'error',
  warn = 'warn',
  info = 'info',
  debug = 'debug',
  trace = 'trace',
  silent = 'silent'
}
