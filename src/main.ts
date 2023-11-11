import './utils/tracing';

import { RequestMethod, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { bold } from 'colorette';

import { description, name, version } from '../package.json';
import { AppModule } from './app.module';
import { IUserRepository } from './core/user/repository/user';
import { UserAdminSeed } from './infra/database/mongo/seed/create-user-admin';
import { ILoggerAdapter } from './infra/logger/adapter';
import { ISecretsAdapter } from './infra/secrets';
import { ApiInternalServerException, BaseException } from './utils/exception';
import { AppExceptionFilter } from './utils/filters/http-exception.filter';
import { ExceptionInterceptor } from './utils/interceptors/http-exception.interceptor';
import { HttpLoggerInterceptor } from './utils/interceptors/http-logger.interceptor';
import { MetricsInterceptor } from './utils/interceptors/metrics.interceptor';
import { TracingInterceptor } from './utils/interceptors/tracing.interceptor';

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
    new ExceptionInterceptor(loggerService),
    new HttpLoggerInterceptor(),
    new TracingInterceptor(loggerService),
    new MetricsInterceptor()
  );

  app.setGlobalPrefix('api', {
    exclude: [
      { path: 'health', method: RequestMethod.GET },
      { path: '/', method: RequestMethod.GET }
    ]
  });

  app.enableVersioning({ type: VersioningType.URI })

  process.on('uncaughtException', (error) => {
    if (!(error instanceof BaseException)) {
      const customError = new ApiInternalServerException(error?.message);
      customError.stack = error.stack;
      loggerService.fatal(customError);
    }
  });

  const { ENV, MONGO_URL, POSTGRES_URL, PORT, HOST, ZIPKIN_URL, PROMETHUES_URL } = app.get(ISecretsAdapter);

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

  loggerService.log(`🟢 ${name} listening at ${bold(PORT)} on ${bold(ENV?.toUpperCase())} 🟢\n`);
  loggerService.log(`🟢 Swagger listening at ${bold(`${HOST}/docs`)} 🟢\n`);

  await app.listen(PORT);

  loggerService.log(`🔵 Postgres listening at ${bold(POSTGRES_URL)}`);
  loggerService.log(`🔵 Mongo listening at ${bold(MONGO_URL)}\n`);
  loggerService.log(`⚪ Zipkin[${bold('Tracing')}] listening at ${bold(ZIPKIN_URL)}`);
  loggerService.log(`⚪ Promethues[${bold('Metrics')}] listening at ${bold(PROMETHUES_URL)}`);

  const userRepository = app.get(IUserRepository);

  await userRepository.seed([UserAdminSeed]);
}
bootstrap();
