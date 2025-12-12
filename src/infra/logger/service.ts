import { IncomingMessage, ServerResponse } from 'node:http';

import { Injectable, InternalServerErrorException, Scope } from '@nestjs/common';
import { blue, gray, green, isColorSupported } from 'colorette';
import { PinoRequestConverter } from 'convert-pino-request-to-curl';
import pino, { LevelWithSilent, LogDescriptor, Logger, multistream } from 'pino';
import { HttpLogger, Options, pinoHttp } from 'pino-http';
import lokiTransport from 'pino-loki';
import pinoPretty, { PrettyOptions } from 'pino-pretty';

import { DateUtils } from '@/utils/date';
import { ApiBadRequestException, ApiInternalServerException, BaseException } from '@/utils/exception';
import { IDGeneratorUtils } from '@/utils/id-generator';

import { name } from '../../../package.json';
import { ILoggerAdapter } from './adapter';
import { ErrorType, MessageInputType } from './types';

@Injectable({ scope: Scope.REQUEST })
export class LoggerService implements ILoggerAdapter {
  static log(message: string) {
    const timestamp = DateUtils.getDateStringWithFormat();
    console.log(`${gray('TRACE')} [${timestamp}]: [${blue(name)}] ${green(message)}`);
  }

  private app!: string;

  logger!: HttpLogger;

  async connect<T = LevelWithSilent>(logLevel: T): Promise<void> {
    const pinoLogger = pino(
      {
        level: [logLevel, 'trace']?.find(Boolean)?.toString()
      },
      multistream([
        {
          level: 'trace',
          stream: pinoPretty(this.getPinoConfig())
        },
        {
          level: 'info',
          stream: lokiTransport({
            host: process.env.LOKI_URL as string,
            labels: { job: 'nestjs' },
            interval: 5
          })
        }
      ])
    );
    this.logger = pinoHttp(this.getPinoHttpConfig(pinoLogger));
  }

  setApplication(app: string): void {
    this.app = app;
  }

  setGlobalParameters(input: object): void {
    this.logger.logger.setBindings(input);
  }

  log(message: string): void {
    LoggerService.log(message);
  }

  debug({ message, context, obj = {} }: MessageInputType): void {
    Object.assign(obj, { context, createdAt: DateUtils.getISODateString() });
    this.logger.logger.debug([obj, gray(message)].find(Boolean), gray(message));
  }

  info({ message, context, obj = {} }: MessageInputType): void {
    Object.assign(obj, { context, createdAt: DateUtils.getISODateString() });
    this.logger.logger.info([obj, message].find(Boolean), message);
  }

  warn(input: MessageInputType): void {
    const { message, context, obj = {} } = input;
    Object.assign(obj, {
      context: context ?? (obj as { context?: string })?.['context'],
      createdAt: DateUtils.getISODateString()
    });
    const finalMessage = typeof input === 'string' ? input : message;
    this.logger.logger.warn([obj, finalMessage].find(Boolean), finalMessage);
  }

  error(error: ErrorType, message?: string): void {
    const errorResponse = this.getErrorResponse(error);

    const response =
      error instanceof BaseException
        ? { statusCode: error.statusCode, message: error?.message, ...this.toPlainObject(error?.parameters) }
        : errorResponse?.value();

    const type =
      {
        Error: BaseException.name
      }[error?.name] || ApiInternalServerException.name;

    const messages = [message, response?.message, error.message].find(Boolean);

    if (error?.name === 'QueryFailedError') {
      Object.assign(error, { parameters: undefined });
    }

    const typeError = [type, error?.name === 'ZodError' ? ApiBadRequestException.name : error?.name].find(Boolean);
    this.logger.logger.error(
      {
        ...this.toPlainObject(response),
        context: error?.context,
        type,
        traceid: this.getTraceId(error),
        createdAt: DateUtils.getISODateString(),
        application: this.app,
        stack: error.stack?.replace(/\n/g, ''),
        ...this.toPlainObject(error?.parameters),
        message: this.getMessage(messages)
      },
      typeError
    );
  }

  private getMessage(messages: string | string[]): string[] {
    if (Array.isArray(messages)) {
      return messages;
    }
    if (messages.includes(`\n`)) {
      return JSON.parse(messages);
    }

    return [messages];
  }

  fatal(error: ErrorType, message?: string): void {
    const messages = [error.message, message].find(Boolean);

    const type = {
      Error: BaseException.name
    }[error?.name];
    const typeError = [type, error?.name === 'ZodError' ? ApiBadRequestException.name : error?.name].find(Boolean);

    this.logger.logger.fatal(
      {
        message: typeof messages === 'string' ? [messages] : messages,
        context: error?.context,
        type: error.name,
        traceid: this.getTraceId(error),
        createdAt: DateUtils.getISODateString(),
        application: this.app,
        stack: error.stack?.replace(/\n/g, '')
      },
      typeError
    );
    process.exit(1);
  }

  private getPinoConfig(): PrettyOptions {
    return {
      colorize: isColorSupported,
      levelFirst: true,
      ignore: 'pid,hostname',
      messageFormat: (log: LogDescriptor, messageKey: string) => {
        const message = log[String(messageKey)];
        return this.app ? `[${blue(this.app)}] ${message}` : message;
      },
      customPrettifiers: {
        time: () => `[${DateUtils.getDateStringWithFormat()}]`
      }
    };
  }

  private getPinoHttpConfig(pinoLogger: Logger): Options {
    return {
      logger: pinoLogger,
      quietReqLogger: true,
      customSuccessMessage: (req: IncomingMessage, res: ServerResponse) => {
        return `request ${res.statusCode >= ApiBadRequestException.STATUS ? 'error' : 'success'} with status code: ${res.statusCode}`;
      },
      customErrorMessage: (req: IncomingMessage, res: ServerResponse, error: Error) => {
        return `request ${error.name} with status code: ${res.statusCode} `;
      },
      customAttributeKeys: {
        req: 'request',
        res: 'response',
        err: 'error',
        responseTime: 'timeTaken',
        reqId: 'traceid'
      },
      serializers: {
        err: () => false,
        req: (request) => {
          return {
            method: request.method,
            curl: PinoRequestConverter.getCurl(request, ['password', 'cpf'])
          };
        },
        res: pino.stdSerializers.res
      },
      customProps: (req: IncomingMessage): object => {
        const request = req as unknown as { context: string; protocol: string };
        const context = request.context;

        const traceid = [req?.headers?.traceid, req.id].find(Boolean);

        const path = `${request.protocol}://${req.headers.host}${req.url}`;

        this.logger.logger.setBindings({
          traceid,
          application: this.app,
          context,
          createdAt: DateUtils.getISODateString()
        });

        return {
          traceid,
          application: this.app,
          context,
          path,
          createdAt: DateUtils.getISODateString()
        };
      },
      customLogLevel: (req: IncomingMessage, res: ServerResponse, error?: Error): pino.LevelWithSilent => {
        return [res.statusCode >= 400, error].some(Boolean)
          ? 'error'
          : [res.statusCode >= 300, res.statusCode <= 400].every(Boolean)
            ? 'silent'
            : 'info';
      }
    };
  }

  private getErrorResponse(error: ErrorType): any {
    const isFunction = typeof error?.getResponse === 'function';
    return [
      {
        conditional: typeof error === 'string',
        value: () => new InternalServerErrorException(error).getResponse()
      },
      {
        conditional: isFunction && typeof error.getResponse() === 'string',
        value: () =>
          new BaseException(
            error.getResponse() as string,
            [error.getStatus(), error['status']].find(Boolean)
          ).getResponse()
      },
      {
        conditional: isFunction && typeof error.getResponse() === 'object',
        value: () => error?.getResponse()
      },
      {
        conditional: [error?.name === Error.name, error?.name == TypeError.name].some(Boolean),
        value: () => new InternalServerErrorException(error.message).getResponse()
      }
    ].find((c) => c.conditional);
  }

  private getTraceId(error: string | { traceid: string }): string {
    return typeof error === 'string'
      ? IDGeneratorUtils.uuid()
      : [error.traceid, this.logger.logger.bindings()?.traceid].find(Boolean);
  }

  private toPlainObject(value: any): Record<string, any> {
    const isNullish = value === null || value === undefined;
    const isArray = Array.isArray(value);
    const isPlain = this.isPlainObject(value);

    return isNullish
      ? {}
      : isArray
        ? { collection: value }
        : isPlain
          ? value
          : this.serializeToPlainObject(value);
  }

  private serializeToPlainObject(value: any): Record<string, any> {
    try {
      const seen = new WeakSet();
      const serialized = JSON.stringify(value, (key, val) => {
        const isObject = typeof val === 'object' && val !== null;

        return isObject && seen.has(val)
          ? '[Circular]'
          : isObject
            ? (seen.add(val), this.serializeValue(val))
            : val;
      });

      const parsed = JSON.parse(serialized);
      const parsedIsArray = Array.isArray(parsed);
      const parsedIsObject = typeof parsed === 'object' && parsed !== null;

      return parsedIsArray
        ? { collection: parsed }
        : parsedIsObject
          ? parsed
          : { _value: parsed };
    } catch {
      return {
        _serialization_error: 'Could not serialize object',
        _type: value?.constructor?.name || typeof value
      };
    }
  }

  private serializeValue(val: any): any {
    return val instanceof Map
      ? Object.fromEntries(val)
      : val instanceof Set
        ? Array.from(val)
        : val instanceof Date
          ? val.toISOString()
          : typeof val === 'function'
            ? '[Function]'
            : typeof val === 'symbol'
              ? val.toString()
              : val;
  }

  private isPlainObject(value: any): boolean {
    const isObject = typeof value === 'object' && value !== null;
    const isArray = Array.isArray(value);
    const prototype = isObject ? Object.getPrototypeOf(value) : null;
    const isPlainPrototype = prototype === null || prototype === Object.prototype;

    return isObject && !isArray && isPlainPrototype;
  }
}
