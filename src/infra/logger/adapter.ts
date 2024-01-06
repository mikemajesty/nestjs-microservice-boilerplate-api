import { LevelWithSilent } from 'pino';
import { HttpLogger } from 'pino-http';

import { ErrorType, MessageType } from './types';

export abstract class ILoggerAdapter<T extends HttpLogger = HttpLogger> {
  abstract logger: T;
  abstract connect<TLevel = LevelWithSilent>(logLevel?: TLevel): void;
  abstract setApplication(app: string): void;
  /**
   * @deprecated The method should be use only in main.ts, this log won't be saved in mongodb, only sdout
   */
  abstract log(message: string): void;
  /**
   * this log won't be saved in mongodb, only sdout
   */
  abstract trace({ message, context, obj }: MessageType): void;
  abstract info({ message, context, obj }: MessageType): void;
  abstract warn({ message, context, obj }: MessageType): void;
  abstract error(error: ErrorType, message?: string, context?: string): void;
  abstract fatal(error: ErrorType, message?: string, context?: string): void;
  abstract setGlobalParameters(input: object): void;
}
