import { BaseException } from '@/utils/exception';

export type MessageType = {
  message: string;
  context?: string;
  obj?: object;
};

export type ErrorType = Error & BaseException;

export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent';
