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
import { metrics } from '@opentelemetry/api'
import { bold } from 'colorette'
import type { FastifyReply, FastifyRequest, HookHandlerDoneFunction } from 'fastify'
import fs from 'fs'
import yaml from 'js-yaml'
import path from 'path'

import { ILoggerAdapter } from '@/infra/logger/adapter'
import { ISecretsAdapter } from '@/infra/secrets'
import { ExceptionHandlerFilter } from '@/middlewares/filters'
import { ByteSize } from '@/utils/byte-size'
import { AppFastifyRequest, ensureTraceId, TRACEID_HEADER } from '@/utils/request'
import { runWithRequestContext } from '@/utils/request/context'

import { name, version } from '../package.json'
import { AppModule } from './app.module'
import { ErrorType } from './infra/logger'
import { EnvEnum } from './infra/secrets/types'
import { initI18n, normalizeLocale, runWithRequestLocale } from './utils/validator'

type LanguageQuery = {
  lang?: string
}

const getPreferredLocale = (request: FastifyRequest<{ Querystring: LanguageQuery }>) => {
  const languageQuery = request.query?.lang
  const acceptLanguage = request.headers['accept-language']
  const firstAcceptLanguage = Array.isArray(acceptLanguage) ? acceptLanguage[0] : acceptLanguage
  const acceptLanguageLocale = firstAcceptLanguage?.split(',')[0].split(';')[0]

  return normalizeLocale([languageQuery, acceptLanguageLocale, 'en-US'].find(Boolean) as string)
}

async function bootstrap() {
  const app = await NestFactory.create(
    AppModule,
    new FastifyAdapter({
      bodyLimit: ByteSize.fromMegabytes(10)
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
  const meter = metrics.getMeter(name, version)
  const requestCounter = meter.createCounter('http_server_requests_count', {
    description: 'Total HTTP requests',
    unit: 'requests'
  })
  const requestDuration = meter.createHistogram('http_server_requests_duration', {
    description: 'Duration of HTTP requests',
    unit: 'ms'
  })
  const activeRequests = meter.createUpDownCounter('http_server_requests_active', {
    description: 'Number of active HTTP requests',
    unit: 'requests'
  })

  const requestStartTimes = new WeakMap<object, bigint>()

  const isSkippedRoute = (url: string | undefined): boolean => {
    const isSkipped = ['/api-docs', '/health', `/.well-known/appspecific/com.chrome.devtools.json`].some((route) =>
      url?.startsWith(route)
    )
    if (isSkipped) {
      return true
    }

    return url === `/`
  }

  const isNoContentRoute = (url: string | undefined): boolean => {
    const isNoContent = ['/favicon.ico', `/.well-known/appspecific/com.chrome.devtools.json`].some((route) =>
      url?.startsWith(route)
    )
    return isNoContent
  }

  fastify.addHook(
    'onRequest',
    (request: FastifyRequest<{ Querystring: LanguageQuery }>, reply: FastifyReply, done: HookHandlerDoneFunction) => {
      if (isNoContentRoute(request.raw.url)) {
        reply.status(204).send()
        return done()
      }

      if (isSkippedRoute(request.raw.url)) {
        return done()
      }

      const traceId = ensureTraceId(request as AppFastifyRequest)
      const requestContext = { [TRACEID_HEADER]: traceId, authorization: request.headers.authorization }

      reply.header('X-Trace-Id', traceId)

      runWithRequestLocale(getPreferredLocale(request), () => runWithRequestContext(requestContext, done))
    }
  )

  fastify.addHook('onRequest', (request: FastifyRequest, reply: FastifyReply, done: HookHandlerDoneFunction) => {
    if (isNoContentRoute(request.raw.url)) {
      reply.status(204).send()
      return done()
    }

    if (isSkippedRoute(request.raw.url)) {
      return done()
    }
    const route = request.routeOptions?.url
    if (!route) {
      return done()
    }

    requestStartTimes.set(request, process.hrtime.bigint())

    activeRequests.add(1, { 'http.method': request.method, 'http.route': route })
    done()
  })

  fastify.addHook('onResponse', (request: FastifyRequest, reply: FastifyReply, done: HookHandlerDoneFunction) => {
    if (isSkippedRoute(request.raw.url)) {
      return done()
    }

    const route = request.routeOptions?.url

    if (!route) {
      return done()
    }

    const startTime = requestStartTimes.get(request)
    if (!startTime) {
      return done()
    }

    const statusCode = Number(reply.statusCode) || 500
    const labels = {
      'http.method': request.method,
      'http.route': route,
      'http.status_code': statusCode,
      'http.status_class': `${Math.floor(statusCode / 100)}xx`
    }

    requestCounter.add(1, labels)
    requestDuration.record(Number(process.hrtime.bigint() - startTime) / 1_000_000, labels)
    requestStartTimes.delete(request)
    activeRequests.add(-1, { 'http.method': request.method, 'http.route': route })
    done()
  })

  const {
    ENV,
    MONGO: { MONGO_URL, MONGO_EXPRESS_URL },
    POSTGRES: { POSTGRES_URL, POSTGRES_PGADMIN_URL },
    PORT,
    HOST,
    ZIPKIN_URL,
    PROMETHUES_URL,
    GRAFANA_URL,
    IS_PRODUCTION
  } = app.get(ISecretsAdapter)

  const styleSrc = {
    [EnvEnum.PRD]: [`'self'`]
  }[ENV] ?? [`'self'`, `'unsafe-inline'`]

  await fastify.register(fastifyHelmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: [`'self'`],
        styleSrc,
        frameSrc: ["'none'"],
        upgradeInsecureRequests: [],
        imgSrc: [`'self'`, 'data:', 'blob:', 'validator.swagger.io'],
        scriptSrc: [`'self'`]
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  })

  await fastify.register(fastifyCompress, {
    encodings: ['gzip', 'deflate'],
    threshold: ByteSize.fromKilobytes(1)
  })

  app.enableVersioning({ type: VersioningType.URI })

  process.on('uncaughtException', (error) => {
    loggerService.error(error as ErrorType)
    process.exit(1)
  })

  process.on('unhandledRejection', (error) => {
    loggerService.error(error as ErrorType)
    process.exit(1)
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
        }
      })
    } catch (error) {
      loggerService.warn({ message: 'Failed to load Swagger documentation', metadata: { cause: error } })
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

  await app.listen(PORT, '0.0.0.0', () => {
    loggerService.log(`🟢 ${name} listening at ${bold(PORT)} on ${bold(ENV?.toUpperCase())} 🟢`)
    if (!IS_PRODUCTION) loggerService.log(`🟢 Swagger listening at ${bold(`${HOST}/api-docs`)} 🟢`)
  })
}

bootstrap()
