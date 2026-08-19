import http from 'http'

const port = Number(process.env.PORT || 5000)
const host = process.env.HOST || '0.0.0.0'
const redact = (value: string | undefined) => (value ? '***' : undefined)
const envSnapshot = {
  APP_MAIN: process.env.APP_MAIN,
  HOST: process.env.HOST,
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  MONGO_DATABASE: process.env.MONGO_DATABASE,
  MONGO_HOST: process.env.MONGO_HOST,
  MONGO_PASSWORD: redact(process.env.MONGO_PASSWORD),
  MONGO_PORT: process.env.MONGO_PORT,
  MONGO_URL: redact(process.env.MONGO_URL),
  MONGO_USER: process.env.MONGO_USER,
  POSTGRES_DATABASE: process.env.POSTGRES_DATABASE,
  POSTGRES_HOST: process.env.POSTGRES_HOST,
  POSTGRES_PASSWORD: redact(process.env.POSTGRES_PASSWORD),
  POSTGRES_PORT: process.env.POSTGRES_PORT,
  POSTGRES_URL: redact(process.env.POSTGRES_URL),
  POSTGRES_USER: process.env.POSTGRES_USER,
  REDIS_HOST: process.env.REDIS_HOST,
  REDIS_PASSWORD: redact(process.env.REDIS_PASSWORD),
  REDIS_PORT: process.env.REDIS_PORT,
  REDIS_URL: redact(process.env.REDIS_URL),
  SMOKE_SECRET_MESSAGE: process.env.SMOKE_SECRET_MESSAGE,
  // OpenTelemetry / Observability
  ZIPKIN_URL: process.env.ZIPKIN_URL,
  PROMETHEUS_URL: process.env.PROMETHEUS_URL,
  PROMETHUES_URL: process.env.PROMETHUES_URL,
  COLLECTOR_OTLP_ENABLED: process.env.COLLECTOR_OTLP_ENABLED,
  OTEL_EXPORTER_OTLP_ENDPOINT: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
  OTEL_EXPORTER_OTLP_PROTOCOL: process.env.OTEL_EXPORTER_OTLP_PROTOCOL,
  GRAFANA_URL: process.env.GRAFANA_URL,
  LOKI_URL: process.env.LOKI_URL
}
const startupLog = JSON.stringify(envSnapshot, null, 2)

const server = http.createServer((request, response) => {
  if (request.url === '/health') {
    response.writeHead(200, { 'content-type': 'application/json' })
    response.end(JSON.stringify({ status: 'ok', env: envSnapshot }))
    return
  }

  response.writeHead(200, { 'content-type': 'text/plain' })
  response.end('nestjs-boilerplate smoke app')
})

server.listen(port, host, () => {
  // eslint-disable-next-line no-console
  console.warn(`Smoke app listening on ${host}:${port}`)
  // eslint-disable-next-line no-console
  console.warn(`Smoke app env snapshot:\n${startupLog}`)
})
