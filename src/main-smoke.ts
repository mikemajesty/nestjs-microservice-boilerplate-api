import http from 'http'

const port = Number(process.env.PORT || 5000)
const host = process.env.HOST || '0.0.0.0'

const server = http.createServer((request, response) => {
  if (request.url === '/health') {
    response.writeHead(200, { 'content-type': 'application/json' })
    response.end(JSON.stringify({ status: 'ok' }))
    return
  }

  response.writeHead(200, { 'content-type': 'text/plain' })
  response.end('nestjs-boilerplate smoke app')
})

server.listen(port, host, () => {
  console.log(`Smoke app listening on ${host}:${port}`)
})
