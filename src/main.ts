import './utils/tracing';

import { RequestMethod, VersioningType } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import bodyParser from 'body-parser';
import { bold } from 'colorette';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';

import { AppExceptionFilter } from '@/common/filters';
import {
  ExceptionInterceptor,
  HttpLoggerInterceptor,
  MetricsInterceptor,
  TracingInterceptor
} from '@/common/interceptors';
import { IUserRepository } from '@/core/user/repository/user';
import { UserAdminSeed } from '@/infra/database/mongo/seed/create-user-admin';
import { ILoggerAdapter } from '@/infra/logger/adapter';
import { ISecretsAdapter } from '@/infra/secrets';
import { ApiInternalServerException } from '@/utils/exception';

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
    new ExceptionInterceptor(loggerService),
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

  app.use(helmet());

  const {
    ENV,
    MONGO_URL,
    POSTGRES_URL,
    PORT,
    HOST,
    ZIPKIN_URL,
    PROMETHUES_URL,
    RATE_LIMIT_BY_USER,
    PGADMIN_URL,
    MONGO_EXPRESS_URL
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
    loggerService.error(error as ErrorType);
  });

  process.on('unhandledRejection', (error) => {
    loggerService.error(error as ErrorType);
  });

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

  await app.listen(PORT, () => {
    loggerService.log(`🟢 ${name} listening at ${bold(PORT)} on ${bold(ENV?.toUpperCase())} 🟢\n`);
    loggerService.log(`🟢 Swagger listening at ${bold(`${HOST}/docs`)} 🟢\n`);
  });

  loggerService.log(`🔵 Postgres listening at ${bold(POSTGRES_URL)}`);
  loggerService.log(`🔶 PgAdmin listening at ${bold(PGADMIN_URL)}\n`);
  loggerService.log(`🔵 Mongo listening at ${bold(MONGO_URL)}`);
  loggerService.log(`🔶 Mongo express listening at ${bold(MONGO_EXPRESS_URL)}\n`);
  loggerService.log(`⚪ Zipkin[${bold('Tracing')}] listening at ${bold(ZIPKIN_URL)}`);
  loggerService.log(`⚪ Promethues[${bold('Metrics')}] listening at ${bold(PROMETHUES_URL)}`);

  const userRepository = app.get(IUserRepository);

  await userRepository.seed([UserAdminSeed]);
}
bootstrap();
