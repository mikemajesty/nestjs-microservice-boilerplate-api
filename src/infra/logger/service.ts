import { IncomingMessage, ServerResponse } from 'node:http';

import { Injectable, InternalServerErrorException, Scope } from '@nestjs/common';
import { blue, gray, green, isColorSupported } from 'colorette';
import pino, { LevelWithSilent, LogDescriptor, Logger, multistream } from 'pino';
import { HttpLogger, Options, pinoHttp } from 'pino-http';
import lokiTransport from 'pino-loki';
import pinoPretty, { PrettyOptions } from 'pino-pretty';

import { DateUtils } from '@/utils/date';
import { ApiBadRequestException, ApiInternalServerException, BaseException } from '@/utils/exception';
import { UUIDUtils } from '@/utils/uuid';

import { name } from '../../../package.json';
import { ILoggerAdapter } from './adapter';
import { ErrorType, MessageInputType } from './types';

@Injectable({ scope: Scope.REQUEST })
export class LoggerService implements ILoggerAdapter {
  static log(message: string) {
    const timestamp = DateUtils.getDateStringWithFormat();
    // eslint-disable-next-line no-console
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
            host: 'http://localhost:3100',
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
        ? { statusCode: error.statusCode, message: error?.message, ...error?.parameters }
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
        ...response,
        context: error?.context,
        type,
        traceid: this.getTraceId(error),
        createdAt: DateUtils.getISODateString(),
        application: this.app,
        stack: error.stack?.replace(/\n/g, ''),
        ...error?.parameters,
        message: typeof messages === 'string' ? [messages] : messages
      },
      typeError
    );
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
        if (this.app) {
          return `[${blue(this.app)}] ${message}`;
        }

        return message;
      },
      customPrettifiers: {
        time: () => {
          return `[${DateUtils.getDateStringWithFormat()}]`;
        }
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
        if ([res.statusCode >= 400, error].some(Boolean)) {
          return 'error';
        }

        if ([res.statusCode >= 300, res.statusCode <= 400].every(Boolean)) {
          return 'silent';
        }

        return 'info';
      }
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    if (typeof error === 'string') return UUIDUtils.create();
    return [error.traceid, this.logger.logger.bindings()?.traceid].find(Boolean);
  }
}

export class PinoRequestConverter {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static getCurl(request: any, anonymizedFields: string[] = []): string {
    const headers = { ...request.headers };
    delete headers['content-length'];

    const headerString = Object.keys(headers)
      .map((key) => `--header '${key}: ${headers[`${key}`]}'`)
      .join(' ');

    const paramsString = Object.keys(request?.params || {})
      .map((param) => `/${param}/${request.params[`${param}`]}`)
      .join('');

    const urlParts = request.url.split('?');
    const baseUrl = urlParts[0];
    const queryString = urlParts[1] ? `?${urlParts[1]}` : '';

    const rawBody = request?.raw?.body;
    const bodyString = rawBody
      ? `--data-raw '${PinoRequestConverter.getBody(anonymizedFields, JSON.stringify(rawBody))}'`
      : '';

    const paramsUrl = request?.params ? paramsString : '';
    const fullUrl = `${request.raw.protocol}://${request.headers.host}${baseUrl}${paramsUrl}${queryString}`;

    const curlCommand = [
      'curl --location -g',
      `--request ${request.method.toUpperCase()}`,
      `'${fullUrl}'`,
      headerString,
      bodyString
    ]
      .filter(Boolean)
      .join(' ')
      .trim();

    return curlCommand;
  }

  private static getBody(anonymizedFields: string[], body: string | undefined): string {
    if (!anonymizedFields.length || !body) {
      return body || '';
    }

    let processedBody = body;

    for (const field of anonymizedFields) {
      const regex = new RegExp(`("${field}":\\s*)"([^"]*)"`, 'g');
      processedBody = processedBody.replace(regex, '$1"******"');
    }

    return processedBody;
  }
}
