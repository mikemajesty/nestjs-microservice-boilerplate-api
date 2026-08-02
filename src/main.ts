/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/setup/main.md
 */
import './utils/tracing'

import { fastifyCompress } from '@fastify/compress'
import { fastifyHelmet } from '@fastify/helmet'
import { fastifySwagger } from '@fastify/swagger'
import { fastifySwaggerUi } from '@fastify/swagger-ui'
import { RequestMethod, VersioningType } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { FastifyAdapter } from '@nestjs/platform-fastify'
import { bold } from 'colorette'
import type { FastifyReply, FastifyRequest } from 'fastify'
import fs from 'fs'
import yaml from 'js-yaml'
import path from 'path'

import { ILoggerAdapter } from '@/infra/logger/adapter'
import { ISecretsAdapter } from '@/infra/secrets'
import { ExceptionHandlerFilter } from '@/middlewares/filters'

import { name } from '../package.json'
import { AppModule } from './app.module'
import { ErrorType } from './infra/logger'
import { changeLanguage, initI18n, normalizeLocale } from './utils/validator'

type LanguageQuery = {
  lang?: string
}

async function bootstrap() {
  const app = await NestFactory.create(
    AppModule,
    new FastifyAdapter({
      bodyLimit: 10 * 1024 * 1024 // 10MB
    }),
    {
      bufferLogs: true,
      cors: true
    }
  )

  const loggerService = app.get(ILoggerAdapter)

  loggerService.setApplication(name)
  app.useLogger(loggerService)

  app.useGlobalFilters(new ExceptionHandlerFilter(loggerService))

  app.setGlobalPrefix('api', {
    exclude: [
      { path: 'alert', method: RequestMethod.POST },
      { path: '/', method: RequestMethod.GET },
      { path: 'health', method: RequestMethod.GET },
      { path: 'health/live', method: RequestMethod.GET },
      { path: 'health/ready', method: RequestMethod.GET },
      { path: 'health/startup', method: RequestMethod.GET }
    ]
  })

  await initI18n('en-US')

  const fastify = app.getHttpAdapter().getInstance()

  fastify.addHook(
    'preHandler',
    async (request: FastifyRequest<{ Querystring: LanguageQuery }>, reply: FastifyReply) => {
      const languegeQuery = request.query?.lang as string
      const acceptLanguage = request.headers['accept-language']

      const rawLocale = [languegeQuery, (acceptLanguage || '').split(',')[0].split(';')[0], 'en-US'].find(
        Boolean
      ) as string

      const locale = normalizeLocale(rawLocale)

      try {
        await changeLanguage(locale as 'en-US' | 'pt-BR' | 'es-ES')
      } catch (error) {
        loggerService.warn({ message: `Failed to change language to ${locale}`, obj: { originalError: error } })
      }

      if (request.raw.url && request.raw.url.split('/').pop() === 'favicon.ico') {
        reply.code(204).send()
      }
    }
  )

  await fastify.register(fastifyHelmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: [`'self'`],
        styleSrc: [`'self'`],
        frameSrc: ["'none'"],
        upgradeInsecureRequests: [],
        imgSrc: [`'self'`, 'data:', 'blob:', 'validator.swagger.io'],
        scriptSrc: [`'self'`]
      }
    },
    xssFilter: true,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  })

  await fastify.register(fastifyCompress, {
    encodings: ['gzip', 'deflate'],
    threshold: 1024 // 1KB
  })

  const {
    ENV,
    TIMEOUT,
    MONGO: { MONGO_URL, MONGO_EXPRESS_URL },
    POSTGRES: { POSTGRES_URL, POSTGRES_PGADMIN_URL },
    PORT,
    HOST,
    ZIPKIN_URL,
    PROMETHUES_URL,
    GRAFANA_URL,
    IS_PRODUCTION
  } = app.get(ISecretsAdapter)

  app.enableVersioning({ type: VersioningType.URI })

  process.on('uncaughtException', (error) => {
    loggerService.error(error as ErrorType)
  })

  process.on('unhandledRejection', (error) => {
    loggerService.error(error as ErrorType)
  })

  if (!IS_PRODUCTION) {
    try {
      const swaggerDocument = yaml.load(
        fs.readFileSync(path.join(__dirname, '../api-spec/tsp-output/@typespec/openapi3/openapi.api.1.0.yaml'), 'utf8')
      )

      await fastify.register(fastifySwagger, {
        mode: 'static',
        specification: {
          document: swaggerDocument
        }
      })

      await fastify.register(fastifySwaggerUi, {
        routePrefix: '/api-docs',
        uiConfig: {
          docExpansion: 'list',
          deepLinking: false
        },
        staticCSP: true,
        transformStaticCSP: (header: string) => header
      })
    } catch (error) {
      loggerService.warn({ message: 'Failed to load Swagger documentation', obj: { originalError: error } })
    }
  }

  loggerService.log(`🔵 Postgres listening at ${bold(POSTGRES_URL)}`)
  loggerService.log(
    `🔶 PgAdmin listening at ${bold(POSTGRES_PGADMIN_URL)} user: ${bold('pgadmin@gmail.com')} password: ${bold('PgAdmin2019!')}`
  )
  loggerService.log(`🔵 Mongo listening at ${bold(MONGO_URL)}`)
  loggerService.log(
    `🔶 Mongo express listening at ${bold(MONGO_EXPRESS_URL)} user: ${bold('admin')} password: ${bold('pass')}\n`
  )
  loggerService.log(`⚪ Grafana[${bold('Graphs')}] listening at ${bold(GRAFANA_URL)}`)
  loggerService.log(`⚪ Zipkin[${bold('Tracing')}] listening at ${bold(ZIPKIN_URL)}`)
  loggerService.log(`⚪ Promethues[${bold('Metrics')}] listening at ${bold(PROMETHUES_URL)}\n`)

  await app.listen(PORT, () => {
    loggerService.log(`🟢 ${name} listening at ${bold(PORT)} on ${bold(ENV?.toUpperCase())} 🟢`)
    if (!IS_PRODUCTION) loggerService.log(`🟢 Swagger listening at ${bold(`${HOST}/api-docs`)} 🟢`)
  })

  const server = fastify.server
  server.timeout = TIMEOUT + 1000
  server.keepAliveTimeout = 60000
  server.headersTimeout = 61000
}

bootstrap()
