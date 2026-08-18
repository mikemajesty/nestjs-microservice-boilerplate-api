import http from 'http'

const port = Number(process.env.PORT || 5000)
const host = process.env.HOST || '0.0.0.0'
const redact = (value: string | undefined) => (value ? '***' : undefined)
const envSnapshot = {
  APP_MAIN: process.env.APP_MAIN,
  HOST: process.env.HOST,
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  POSTGRES_DATABASE: process.env.POSTGRES_DATABASE,
  POSTGRES_HOST: process.env.POSTGRES_HOST,
  POSTGRES_PASSWORD: redact(process.env.POSTGRES_PASSWORD),
  POSTGRES_PORT: process.env.POSTGRES_PORT,
  POSTGRES_URL: redact(process.env.POSTGRES_URL),
  POSTGRES_USER: process.env.POSTGRES_USER,
  SMOKE_SECRET_MESSAGE: process.env.SMOKE_SECRET_MESSAGE
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
