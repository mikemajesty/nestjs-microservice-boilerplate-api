import './utils/tracing';

import { RequestMethod, VersioningType } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import bodyParser from 'body-parser';
import { bold } from 'colorette';
import compression from 'compression';
import csurf from 'csurf';
import { NextFunction, Request, Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';

import { AppExceptionFilter } from '@/common/filters';
import {
  ExceptionInterceptor,
  HttpLoggerInterceptor,
  MetricsInterceptor,
  TracingInterceptor
} from '@/common/interceptors';
import { ILoggerAdapter } from '@/infra/logger/adapter';
import { ISecretsAdapter } from '@/infra/secrets';

import { description, name, version } from '../package.json';
import { AppModule } from './app.module';
import { RequestTimeoutInterceptor } from './common/interceptors/request-timeout.interceptor';
import { ErrorType } from './infra/logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    cors: true
  });

  const loggerService = app.get(ILoggerAdapter);

  loggerService.setApplication(name);

  app.useLogger(loggerService);

  app.useGlobalFilters(new AppExceptionFilter(loggerService));

  app.useGlobalInterceptors(
    new RequestTimeoutInterceptor(new Reflector(), loggerService),
    new ExceptionInterceptor(),
    new HttpLoggerInterceptor(loggerService),
    new TracingInterceptor(loggerService),
    new MetricsInterceptor()
  );

  app.setGlobalPrefix('api', {
    exclude: [
      { path: 'health', method: RequestMethod.GET },
      { path: '/', method: RequestMethod.GET }
    ]
  });

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: [`'self'`],
          styleSrc: [`'self'`, `'unsafe-inline'`],
          imgSrc: [`'self'`, 'data:', 'blob:', 'validator.swagger.io'],
          scriptSrc: [`'self'`, `https: 'unsafe-inline'`]
        }
      }
    })
  );

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.originalUrl && req.originalUrl.split('/').pop() === 'favicon.ico') {
      return res.sendStatus(204);
    }
    next();
  });

  app.use(compression());
  app.use(csurf());

  const {
    ENV,
    MONGO: { MONGO_URL, MONGO_EXPRESS_URL },
    POSTGRES: { POSTGRES_URL, POSTGRES_PGADMIN_URL },
    PORT,
    HOST,
    ZIPKIN_URL,
    PROMETHUES_URL,
    RATE_LIMIT_BY_USER,
    IS_PRODUCTION
  } = app.get(ISecretsAdapter);

  /**
   *@description @RATE_LIMIT_BY_USER  for each 15 minutes
   */
  const MINUTES = 15 * 60 * 1000;
  const limiter = rateLimit({
    windowMs: MINUTES,
    limit: RATE_LIMIT_BY_USER,
    standardHeaders: 'draft-7',
    legacyHeaders: false
  });

  app.use(limiter);

  app.use(bodyParser.urlencoded({ extended: true }));

  app.enableVersioning({ type: VersioningType.URI });

  process.on('uncaughtException', (error) => {
    loggerService.fatal(error as ErrorType);
  });

  process.on('unhandledRejection', (error) => {
    loggerService.fatal(error as ErrorType);
  });

  if (!IS_PRODUCTION) {
    const config = new DocumentBuilder()
      .setTitle(name)
      .setDescription(description)
      .addBearerAuth()
      .setVersion(version)
      .addServer(HOST)
      .addTag('Swagger Documentation')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  loggerService.log(`🔵 Postgres listening at ${bold(POSTGRES_URL)}`);
  loggerService.log(`🔶 PgAdmin listening at ${bold(POSTGRES_PGADMIN_URL)}\n`);
  loggerService.log(`🔵 Mongo listening at ${bold(MONGO_URL)}`);
  loggerService.log(`🔶 Mongo express listening at ${bold(MONGO_EXPRESS_URL)}\n`);
  loggerService.log(`⚪ Zipkin[${bold('Tracing')}] listening at ${bold(ZIPKIN_URL)}`);
  loggerService.log(`⚪ Promethues[${bold('Metrics')}] listening at ${bold(PROMETHUES_URL)}\n`);

  await app.listen(PORT, () => {
    loggerService.log(`🟢 ${name} listening at ${bold(PORT)} on ${bold(ENV?.toUpperCase())} 🟢`);
    if (!IS_PRODUCTION) loggerService.log(`🟢 Swagger listening at ${bold(`${HOST}/docs`)} 🟢`);
  });
}
bootstrap();
