import { RequestMethod } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { bold } from 'colorette';

import { description, name, version } from '../package.json';
import { AppModule } from './app.module';
import { ILoggerAdapter } from './infra/logger/adapter';
import { ISecretsAdapter } from './infra/secrets';
import { AppExceptionFilter } from './utils/filters/http-exception.filter';
import { ExceptionInterceptor } from './utils/interceptors/http-exception.interceptor';
import { HttpLoggerInterceptor } from './utils/interceptors/http-logger.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    cors: true
  });

  const loggerService = app.get(ILoggerAdapter);

  loggerService.setApplication(name);

  app.useLogger(loggerService);

  app.useGlobalFilters(new AppExceptionFilter(loggerService));

  app.useGlobalInterceptors(new ExceptionInterceptor(), new HttpLoggerInterceptor(loggerService));

  app.setGlobalPrefix('api', {
    exclude: [
      { path: 'health', method: RequestMethod.GET },
      { path: '/', method: RequestMethod.GET }
    ]
  });

  const { ENV, MONGO_URL, POSTGRES_URL, PORT, KIBANA_URL, HOST } = app.get(ISecretsAdapter);

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
  loggerService.log(`🔵 Mongo listening at ${bold(MONGO_URL)}`);
  loggerService.log(`🔵 kibana listening at ${bold(KIBANA_URL)}`);
}
bootstrap();
