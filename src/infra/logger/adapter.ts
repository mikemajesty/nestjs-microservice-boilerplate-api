import { HttpLogger } from 'pino-http';

import { ErrorType, LogLevelEnum, MessageType } from './types';

export abstract class ILoggerAdapter<T extends HttpLogger = HttpLogger> {
  abstract logger: T;
  abstract connect<TLevel = LogLevelEnum>(logLevel?: TLevel): void;
  abstract setApplication(app: string): void;
  abstract log(message: string): void;
  abstract debug({ message, context, obj }: MessageType): void;
  abstract info({ message, context, obj }: MessageType): void;
  abstract warn({ message, context, obj }: MessageType): void;
  abstract error(error: ErrorType, message?: string | string[]): void;
  abstract fatal(error: ErrorType, message?: string | string[]): void;
  abstract setGlobalParameters(input: object): void;
}
