/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/infra/http.md
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/tests/standards.md
 */

import http, { createServer, IncomingHttpHeaders, IncomingMessage, Server, ServerResponse } from 'node:http'
import { AddressInfo } from 'node:net'
import { gzipSync } from 'node:zlib'

import { ByteSize } from '@/utils/byte-size'
import {
  ApiBadGatewayException,
  ApiBadRequestException,
  ApiConflictException,
  ApiForbiddenException,
  ApiInternalServerException,
  ApiNotFoundException,
  ApiServiceUnavailableException,
  ApiUnauthorizedException,
  ApiUnprocessableEntityException,
  BaseException
} from '@/utils/exception'
import { TRACEID_HEADER } from '@/utils/request'
import { runWithRequestContext } from '@/utils/request/context'
import { Deadline, runWithDeadline } from '@/utils/request/deadline'
import { TimeoutBudget } from '@/utils/request/timeout-budget'
import { MockUtils } from '@/utils/test'
import { TestUtils } from '@/utils/test/utils'
import { InputValidator } from '@/utils/validator'

import { HttpService } from '../service'

type Reply = {
  status?: number
  delayMs?: number
  body?: unknown
  gzip?: boolean
  headers?: Record<string, string>
  destroySocket?: boolean
}

type Attempt = {
  at: number
  method?: string
  path?: string
  headers: IncomingHttpHeaders
  body: string
}

/**
 * Local HTTP server with scripted replies. Every request consumes the next reply in the
 * queue and falls back to `fallback` once the queue is empty, so a test can describe
 * sequences like "503, 503, 200" and count how many attempts actually reached the server.
 */
class ScriptedHttpServer {
  readonly attempts: Attempt[] = []
  private queue: Reply[] = []
  private fallback: Reply = { status: 200, body: { ok: true } }
  private readonly timers = new Set<NodeJS.Timeout>()
  private server!: Server
  url!: string

  async start(): Promise<void> {
    this.server = http.createServer((req, res) => this.handle(req, res))
    await new Promise<void>((resolve) => this.server.listen(0, '127.0.0.1', resolve))
    const { port } = this.server.address() as AddressInfo
    this.url = `http://127.0.0.1:${port}`
  }

  reset(): void {
    this.attempts.length = 0
    this.queue = []
    this.fallback = { status: 200, body: { ok: true } }
    this.timers.forEach(clearTimeout)
    this.timers.clear()
  }

  replyWith(...replies: Reply[]): this {
    this.queue.push(...replies)
    return this
  }

  alwaysReply(reply: Reply): this {
    this.fallback = reply
    return this
  }

  async close(): Promise<void> {
    this.timers.forEach(clearTimeout)
    this.server.closeAllConnections()
    await new Promise<void>((resolve) => this.server.close(() => resolve()))
  }

  private handle(req: IncomingMessage, res: ServerResponse): void {
    const attempt: Attempt = { at: Date.now(), method: req.method, path: req.url, headers: req.headers, body: '' }
    this.attempts.push(attempt)
    const reply = this.queue.shift() ?? this.fallback

    if (reply.destroySocket) {
      req.socket.destroy()
      return
    }

    req.setEncoding('utf8')
    req.on('data', (chunk: string) => {
      attempt.body += chunk
    })

    const respond = () => {
      if (res.destroyed) return
      const status = reply.status ?? 200
      const payload = JSON.stringify(reply.body ?? { message: `status ${status}` })

      if (reply.gzip) {
        res.writeHead(status, { ...reply.headers, 'content-type': 'application/json', 'content-encoding': 'gzip' })
        res.end(gzipSync(payload))
        return
      }

      res.writeHead(status, { ...reply.headers, 'content-type': 'application/json' })
      res.end(payload)
    }

    if (!reply.delayMs) {
      respond()
      return
    }

    const timer = setTimeout(() => {
      this.timers.delete(timer)
      respond()
    }, reply.delayMs)
    this.timers.add(timer)
  }
}

const captureError = async (promise: Promise<unknown>): Promise<BaseException> => {
  try {
    await promise
  } catch (error) {
    return error as BaseException
  }
  throw new Error('expected request to fail')
}

const measure = async <T>(callback: () => Promise<T>): Promise<{ result: T; elapsedMs: number }> => {
  const startedAt = Date.now()
  const result = await callback()
  return { result, elapsedMs: Date.now() - startedAt }
}

// Network/timer scheduling noise allowed on top of time assertions.
const TIMING_TOLERANCE_MS = 250

describe(HttpService.name, () => {
  const server = new ScriptedHttpServer()
  const logger = MockUtils.Logger()

  let http: HttpService

  beforeAll(async () => {
    await server.start()
  })

  beforeEach(() => {
    TestUtils.clearMocks()
    http = new HttpService(logger)
    // Full jitter delay = random * 2^retry * 1000. Zero keeps retry tests fast by default.
    TestUtils.spyOn(Math, 'random').mockReturnValue(0)
  })

  afterEach(() => {
    TestUtils.restoreMocks()
    server.reset()
  })

  afterAll(async () => {
    await server.close()
  })

  describe('retry conditions', () => {
    test('when .retry() is not configured, should not retry by default (opt-in)', async () => {
      server.alwaysReply({ status: 503 })

      const error = await captureError(http.request().get(server.url).execute())

      expect(error.statusCode).toBe(503)
      expect(server.attempts).toHaveLength(1)
    })

    test('when a default retryable status persists, should retry until exhausted and convert the final error', async () => {
      server.alwaysReply({ status: 503, body: { message: 'upstream unavailable' } })

      const error = await captureError(http.request().get(server.url).retry({ retries: 2 }).execute())

      expect(server.attempts).toHaveLength(3)
      expect(error).toBeInstanceOf(BaseException)
      expect(error.statusCode).toBe(503)
      expect(error.message).toBe('upstream unavailable')
    })

    test('when a status is outside the retryable list, should not retry', async () => {
      server.alwaysReply({ status: 400 })

      const error = await captureError(http.request().get(server.url).retry({ retries: 3 }).execute())

      expect(error.statusCode).toBe(400)
      expect(server.attempts).toHaveLength(1)
    })

    test('when retryStatusCodes is configured on the request, should use it instead of the default list', async () => {
      server.replyWith({ status: 418 }, { status: 503 })

      const error = await captureError(
        http
          .request()
          .get(server.url)
          .retry({ retries: 3, retryStatusCodes: [418] })
          .execute()
      )

      expect(error.statusCode).toBe(503)
      expect(server.attempts).toHaveLength(2)
    })

    test('when a retry succeeds, should resolve with the successful response', async () => {
      server.replyWith({ status: 503 }, { status: 502 }).alwaysReply({ status: 200, body: { id: 1 } })

      const result = await http.request().get<{ id: number }>(server.url).retry({ retries: 3 }).execute()

      expect(result).toEqual({ id: 1 })
      expect(server.attempts).toHaveLength(3)
    })

    test('when the connection resets, should retry the request', async () => {
      server.replyWith({ destroySocket: true }).alwaysReply({ status: 200, body: { ok: true } })

      const result = await http.request().get(server.url).retry({ retries: 1 }).execute()

      expect(result).toEqual({ ok: true })
      expect(server.attempts).toHaveLength(2)
    })

    test('when retrying a POST request, should resend its body and content type', async () => {
      server.replyWith({ status: 503 }, { status: 503 }).alwaysReply({ status: 201, body: { id: 'abc' } })
      const payload = { name: 'john', tags: ['a', 'b'] }

      const result = await http.request().post(server.url, payload).retry({ retries: 2 }).execute()

      expect(result).toEqual({ id: 'abc' })
      expect(server.attempts).toHaveLength(3)
      server.attempts.forEach((attempt) => {
        expect(attempt.method).toBe('POST')
        expect(attempt.headers['content-type']).toContain('application/json')
        expect(JSON.parse(attempt.body)).toEqual(payload)
      })
    })

    test('when retrying a request with propagated and custom headers, should resend those headers', async () => {
      server.alwaysReply({ status: 503 })
      const context = { [TRACEID_HEADER]: 'trace-retry', authorization: 'Bearer token' }

      await runWithRequestContext(context, () =>
        captureError(
          http
            .request()
            .get(server.url)
            .header('x-custom', 'custom')
            .propagateAuthorization()
            .retry({ retries: 2 })
            .execute()
        )
      )

      expect(server.attempts).toHaveLength(3)
      server.attempts.forEach((attempt) => {
        expect(attempt.headers[TRACEID_HEADER]).toBe('trace-retry')
        expect(attempt.headers.authorization).toBe('Bearer token')
        expect(attempt.headers['x-custom']).toBe('custom')
      })
    })

    test('when an attempt hits the client timeout, should retry the request', async () => {
      server.replyWith({ status: 200, delayMs: 1000 }).alwaysReply({ status: 200, body: { ok: true } })

      const result = await http.request().get(server.url).timeout(300).retry({ retries: 1 }).execute()

      expect(result).toEqual({ ok: true })
      expect(server.attempts).toHaveLength(2)
    })

    test('when the same builder is executed more than once, should not leak retry state', async () => {
      server.alwaysReply({ status: 503 })
      const request = http.request().get(server.url).retry({ retries: 2 })

      await captureError(request.execute())
      await captureError(request.execute())

      expect(server.attempts).toHaveLength(6)
    })
  })

  describe('connection refused', () => {
    const getFreePort = async (): Promise<number> => {
      const probe = createServer()
      await new Promise<void>((resolve) => probe.listen(0, '127.0.0.1', resolve))
      const { port } = probe.address() as AddressInfo
      await new Promise<void>((resolve) => probe.close(() => resolve()))
      return port
    }

    test('when the dependency recovers after ECONNREFUSED, should retry and succeed', async () => {
      TestUtils.spyOn(Math, 'random').mockReturnValue(0.5)
      const port = await getFreePort()
      const restarted = createServer((_req, res) => {
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ ok: true }))
      })
      const startLater = setTimeout(() => restarted.listen(port, '127.0.0.1'), 300)

      try {
        const result = await new HttpService(logger)
          .request()
          .get(`http://127.0.0.1:${port}`)
          .retry({ retries: 2 })
          .execute()

        expect(result).toEqual({ ok: true })
      } finally {
        clearTimeout(startLater)
        restarted.closeAllConnections()
        await new Promise<void>((resolve) => restarted.close(() => resolve()))
      }
    })

    test('when ECONNREFUSED persists through all retries, should convert it to 503', async () => {
      const port = await getFreePort()

      const error = await captureError(
        new HttpService(logger).request().get(`http://127.0.0.1:${port}`).retry({ retries: 2 }).execute()
      )

      expect(error).toBeInstanceOf(ApiServiceUnavailableException)
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'All retry attempts failed after 2 retries' })
      )
    })
  })

  describe('Retry-After', () => {
    test('when Retry-After is a number, should wait that duration instead of the backoff', async () => {
      server
        .replyWith({ status: 429, headers: { 'retry-after': '1' } })
        .alwaysReply({ status: 200, body: { ok: true } })

      const result = await http.request().get(server.url).retry({ retries: 1 }).execute()

      expect(result).toEqual({ ok: true })
      expect(server.attempts[1].at - server.attempts[0].at).toBeGreaterThanOrEqual(1000)
    })

    test('when Retry-After is an HTTP-date, should wait until that date', async () => {
      const retryAt = new Date(Date.now() + 2000).toUTCString()
      server.replyWith({ status: 503, headers: { 'retry-after': retryAt } }).alwaysReply({ status: 200 })

      await http.request().get(server.url).retry({ retries: 1 }).execute()

      // HTTP-date has second precision, so the wait is between 1s and 2s.
      expect(server.attempts[1].at - server.attempts[0].at).toBeGreaterThanOrEqual(900)
    })

    test('when Retry-After exceeds the retry budget, should fail fast', async () => {
      server.alwaysReply({ status: 429, headers: { 'retry-after': '10' } })

      const { result: error, elapsedMs } = await measure(() =>
        captureError(http.request().get(server.url).retry({ retries: 3 }).execute())
      )

      expect(error).toBeInstanceOf(ApiServiceUnavailableException)
      expect(server.attempts).toHaveLength(1)
      expect(elapsedMs).toBeLessThan(TIMING_TOLERANCE_MS)
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Retry budget exhausted',
          metadata: expect.objectContaining({ retryAfter: 10_000 })
        })
      )
    })

    test('when Retry-After is invalid, should fall back to the backoff', async () => {
      server.replyWith({ status: 503, headers: { 'retry-after': 'soon' } }).alwaysReply({ status: 200 })

      await http.request().get(server.url).retry({ retries: 1 }).execute()

      expect(server.attempts).toHaveLength(2)
      expect(server.attempts[1].at - server.attempts[0].at).toBeLessThan(TIMING_TOLERANCE_MS)
    })
  })

  describe('retry budget', () => {
    test('when a retry budget is configured, should keep attempts and backoff within it', async () => {
      // Worst-case jitter: the first retry waits the full 2000ms.
      TestUtils.spyOn(Math, 'random').mockReturnValue(1)
      server.alwaysReply({ status: 503, delayMs: 600 })
      const retryBudgetMs = 3000

      const { result: error, elapsedMs } = await measure(() =>
        captureError(http.request().get(server.url).retry({ retries: 3, retryBudgetMs }).execute())
      )

      expect(server.attempts.length).toBeGreaterThanOrEqual(2)
      expect(elapsedMs).toBeLessThan(retryBudgetMs + TIMING_TOLERANCE_MS)
      expect(error).toBeInstanceOf(BaseException)
    })

    test('when calculating the retry budget, should account for every attempt', async () => {
      // Delays: 200ms, 400ms, 800ms. Fast failures should fit several retries in the budget.
      TestUtils.spyOn(Math, 'random').mockReturnValue(0.1)
      server.alwaysReply({ status: 503, delayMs: 100 })
      const retryBudgetMs = 1200

      const { elapsedMs } = await measure(() =>
        captureError(http.request().get(server.url).retry({ retries: 5, retryBudgetMs }).execute())
      )

      // 100 + 200 + 100 + 400 + 100 = 900ms; the next 800ms backoff no longer fits.
      expect(server.attempts).toHaveLength(3)
      expect(elapsedMs).toBeLessThan(retryBudgetMs + TIMING_TOLERANCE_MS)
    })

    test('when jitter changes the retry delay, should schedule using the actual delay', async () => {
      // Delays: 200ms, 400ms, 800ms. With the default 4000ms budget all three retries fit.
      TestUtils.spyOn(Math, 'random').mockReturnValue(0.1)
      server.alwaysReply({ status: 503, delayMs: 100 })

      await captureError(http.request().get(server.url).retry({ retries: 3 }).execute())

      expect(server.attempts).toHaveLength(4)
    })

    test('when a retry attempt would exceed the budget, should abort it', async () => {
      // 600ms failure + 2000ms backoff = 2600ms; only ~400ms of the 3000ms budget is left for
      // the retry, while the server would only answer it after 2000ms.
      TestUtils.spyOn(Math, 'random').mockReturnValue(1)
      server.replyWith({ status: 503, delayMs: 600 }).alwaysReply({ status: 200, delayMs: 2000 })
      const retryBudgetMs = 3000

      const { result: error, elapsedMs } = await measure(() =>
        captureError(http.request().get(server.url).retry({ retries: 3, retryBudgetMs }).execute())
      )

      expect(server.attempts).toHaveLength(2)
      expect(error.statusCode).toBe(408)
      expect(elapsedMs).toBeLessThan(retryBudgetMs + TIMING_TOLERANCE_MS)
    })

    test('when retryBudgetMs exceeds DEPENDENCY_TIMEOUT_MS, should cap it', async () => {
      // HTTP_REQUEST_TIMEOUT_MS=5000 in tests -> DEPENDENCY_TIMEOUT_MS=4000.
      TestUtils.spyOn(Math, 'random').mockReturnValue(1)
      server.alwaysReply({ status: 503, delayMs: 1500 })
      const dependencyTimeoutMs = TimeoutBudget.DEPENDENCY_TIMEOUT_MS

      const { elapsedMs } = await measure(() =>
        captureError(http.request().get(server.url).retry({ retries: 3, retryBudgetMs: 10_000 }).execute())
      )

      expect(dependencyTimeoutMs).toBe(4000)
      expect(server.attempts).toHaveLength(2)
      expect(elapsedMs).toBeLessThan(dependencyTimeoutMs + TIMING_TOLERANCE_MS)
    })

    test('when the inbound deadline expires during retries, should stop retrying', async () => {
      // Delays: 200ms, 400ms, 800ms. Without a deadline all 3 retries fit in the 4000ms budget;
      // with 1000ms left the third backoff no longer fits.
      TestUtils.spyOn(Math, 'random').mockReturnValue(0.1)
      server.alwaysReply({ status: 503, delayMs: 100 })
      const deadlineMs = 1000

      const { elapsedMs } = await measure(() =>
        runWithDeadline(Deadline.fromTimeout(deadlineMs), () =>
          captureError(http.request().get(server.url).retry({ retries: 3 }).execute())
        )
      )

      expect(server.attempts).toHaveLength(3)
      expect(elapsedMs).toBeLessThan(deadlineMs)
    })

    test('when the inbound deadline limits the retry window, should not retry beyond it', async () => {
      TestUtils.spyOn(Math, 'random').mockReturnValue(1)
      server.alwaysReply({ status: 503, delayMs: 300 })
      const deadlineMs = 1500

      const { elapsedMs } = await measure(() =>
        runWithDeadline(Deadline.fromTimeout(deadlineMs), () =>
          captureError(http.request().get(server.url).retry({ retries: 3 }).execute())
        )
      )

      expect(server.attempts).toHaveLength(1)
      expect(elapsedMs).toBeLessThan(deadlineMs)
    })
  })

  describe('timeout', () => {
    test('when a timeout is configured on the HttpService instance, should respect it', async () => {
      const service = new HttpService(logger, { timeout: 300 })
      server.alwaysReply({ status: 200, delayMs: 1000 })

      const { elapsedMs } = await measure(() => captureError(service.request().get(server.url).execute()))

      expect(elapsedMs).toBeLessThan(300 + TIMING_TOLERANCE_MS)
    })

    test('when .timeout() is configured on the request, should convert its timeout to a 408', async () => {
      server.alwaysReply({ status: 200, delayMs: 1000 })

      const { result: error, elapsedMs } = await measure(() =>
        captureError(http.request().get(server.url).timeout(300).execute())
      )

      expect(error.statusCode).toBe(408)
      expect(elapsedMs).toBeLessThan(300 + TIMING_TOLERANCE_MS)
    })

    test('when the inbound deadline is shorter than .timeout(), should cap the request timeout', async () => {
      server.alwaysReply({ status: 200, delayMs: 1500 })

      const { elapsedMs } = await measure(() =>
        runWithDeadline(Deadline.fromTimeout(400), () =>
          captureError(http.request().get(server.url).timeout(3000).execute())
        )
      )

      expect(elapsedMs).toBeLessThan(400 + TIMING_TOLERANCE_MS)
    })

    test('when the inbound deadline has expired, should fail fast with a timeout error', async () => {
      server.alwaysReply({ status: 200, delayMs: 1500 })

      const { result: error, elapsedMs } = await measure(() =>
        runWithDeadline(new Deadline(Date.now() - 1), () => captureError(http.request().get(server.url).execute()))
      )

      expect(error.statusCode).toBe(408)
      expect(server.attempts).toHaveLength(0)
      expect(elapsedMs).toBeLessThan(TIMING_TOLERANCE_MS)
    })
  })

  describe('context propagation', () => {
    test('when forwarding request context, should always propagate traceid and authorization only when requested', async () => {
      const context = { [TRACEID_HEADER]: 'trace-123', authorization: 'Bearer token' }

      const deadline = new Deadline(Date.now() + 10_000)

      await runWithDeadline(deadline, () =>
        runWithRequestContext(context, async () => {
          await http
            .request()
            .get(server.url)
            .header('X-Request-Deadline', String(deadline.expiresAt + 60_000))
            .execute()
          await http.request().get(server.url).propagateAuthorization().execute()
        })
      )

      expect(server.attempts[0].headers[TRACEID_HEADER]).toBe('trace-123')
      expect(server.attempts[0].headers['x-request-deadline']).toBe(String(deadline.expiresAt))
      expect(server.attempts[0].headers.authorization).toBeUndefined()
      expect(server.attempts[1].headers.authorization).toBe('Bearer token')
    })
  })

  describe('sensitive data', () => {
    test('when logging a failed request as curl, should mask sensitive fields, headers, and query params', async () => {
      server.alwaysReply({ status: 400 })
      const payload = { name: 'john', password: 'super-secret', cpf: '12345678900', token: 'token-secret' }

      const error = await captureError(
        http
          .request()
          .post(`${server.url}/login?api_key=query-secret&page=1`, payload)
          .headers({
            Authorization: 'Bearer header-secret',
            Cookie: 'session=cookie-secret',
            'x-api-key': 'api-key-secret',
            'x-request-source': 'visible'
          })
          .execute()
      )
      const curl = (error.cause as { curl?: string }).curl

      expect(curl).toEqual(expect.stringContaining('john'))
      expect(curl).toEqual(expect.stringContaining('page=1'))
      expect(curl).toEqual(expect.stringContaining('visible'))
      ;['super-secret', '12345678900', 'token-secret', 'header-secret', 'cookie-secret', 'api-key-secret', 'query-secret'].forEach(
        (secret) => {
          expect(curl).not.toContain(secret)
        }
      )
    })
  })

  describe('concurrency', () => {
    test('when requests run in parallel on the same instance, should isolate retry configuration', async () => {
      server.alwaysReply({ status: 503 })

      await Promise.all([
        captureError(http.request().get(`${server.url}/a`).retry({ retries: 2 }).execute()),
        captureError(http.request().get(`${server.url}/b`).execute()),
        captureError(
          http
            .request()
            .get(`${server.url}/c`)
            .retry({ retries: 2, retryStatusCodes: [418] })
            .execute()
        ),
        captureError(http.request().get(`${server.url}/d`).retry({ retries: 1 }).execute())
      ])

      const attemptsByPath = (path: string) => server.attempts.filter((attempt) => attempt.path === path)
      expect(attemptsByPath('/a')).toHaveLength(3)
      expect(attemptsByPath('/b')).toHaveLength(1)
      expect(attemptsByPath('/c')).toHaveLength(1)
      expect(attemptsByPath('/d')).toHaveLength(2)
    })
  })

  describe('error conversion', () => {
    it.each([
      [400, ApiBadRequestException],
      [401, ApiUnauthorizedException],
      [403, ApiForbiddenException],
      [404, ApiNotFoundException],
      [409, ApiConflictException],
      [422, ApiUnprocessableEntityException],
      [502, ApiBadGatewayException],
      [503, ApiServiceUnavailableException],
      [418, ApiInternalServerException]
    ])('should convert status %i to %p', async (status, ExceptionClass) => {
      server.alwaysReply({ status })

      const error = await captureError(http.request().get(server.url).execute())

      expect(error).toBeInstanceOf(ExceptionClass)
    })

    it.each([
      ['message', { message: 'from message' }, 'from message'],
      ['description', { description: 'from description' }, 'from description'],
      ['error.message', { error: { message: 'from error.message' } }, 'from error.message'],
      ['statusText when the body has no message', {}, 'Not Found']
    ])('should extract the error message from %s', async (_, body, expectedMessage) => {
      server.alwaysReply({ status: 404, body })

      const error = await captureError(http.request().get(server.url).execute())

      expect(error.message).toBe(expectedMessage)
    })

    test('when an upstream returns 429, should convert it to 503 and retain the original status in logs', async () => {
      server.alwaysReply({ status: 429, body: { message: 'rate limited' } })

      const error = await captureError(http.request().get(server.url).execute())

      expect(error).toBeInstanceOf(ApiServiceUnavailableException)
      expect(error.statusCode).toBe(503)
      expect(error.message).toBe('rate limited')
      expect(error.parameters.upstreamStatus).toBe(429)
    })

    test('when converting an Axios error, should preserve it and its request metadata on the exception', async () => {
      server.alwaysReply({ status: 404 })

      const error = await captureError(http.request().delete(`${server.url}/users/1`).execute())

      expect(error.cause).toBeDefined()
      expect(error.parameters).toEqual(
        expect.objectContaining({ url: `${server.url}/users/1`, method: 'DELETE', context: 'HttpBuilder' })
      )
    })
  })

  describe('http verbs', () => {
    it.each(['put', 'patch'] as const)('should send %s with the same body on every retry', async (verb) => {
      server.replyWith({ status: 503 }).alwaysReply({ status: 200, body: { ok: true } })
      const payload = { name: 'john' }

      const result = await http.request()[`${verb}`](server.url, payload).retry({ retries: 1 }).execute()

      expect(result).toEqual({ ok: true })
      expect(server.attempts).toHaveLength(2)
      server.attempts.forEach((attempt) => {
        expect(attempt.method).toBe(verb.toUpperCase())
        expect(JSON.parse(attempt.body)).toEqual(payload)
      })
    })

    test('when retrying a DELETE request, should send it without a body', async () => {
      server.replyWith({ status: 503 }).alwaysReply({ status: 204 })

      await http.request().delete(server.url).retry({ retries: 1 }).execute()

      expect(server.attempts).toHaveLength(2)
      server.attempts.forEach((attempt) => {
        expect(attempt.method).toBe('DELETE')
        expect(attempt.body).toBe('')
      })
    })
  })

  describe('payload size limits', () => {
    // JSON body of roughly `size` bytes.
    const bodyOfSize = (size: number) => ({ data: 'x'.repeat(size) })

    test('when a default response limit is configured, should apply it to the HttpService instance', () => {
      const service = new HttpService(logger)

      expect(HttpService.DEFAULT_MAX_RESPONSE_SIZE_BYTES).toBe(ByteSize.fromMegabytes(10))
      expect(HttpService.DEFAULT_MAX_REQUEST_SIZE_BYTES).toBe(ByteSize.fromMegabytes(10))
      expect(service['axios'].defaults.maxContentLength).toBe(HttpService.DEFAULT_MAX_RESPONSE_SIZE_BYTES)
      expect(service['axios'].defaults.maxBodyLength).toBe(HttpService.DEFAULT_MAX_REQUEST_SIZE_BYTES)
    })

    test('when the response is below the limit, should accept it', async () => {
      server.alwaysReply({ status: 200, body: bodyOfSize(ByteSize.fromKilobytes(1)) })

      const result = await http
        .request()
        .get(server.url)
        .maxResponseSize(ByteSize.fromKilobytes(2))
        .execute()

      expect(result).toEqual(bodyOfSize(ByteSize.fromKilobytes(1)))
    })

    test('when the response exceeds the limit, should fail with 502 without retrying', async () => {
      server.alwaysReply({ status: 200, body: bodyOfSize(ByteSize.fromKilobytes(4)) })

      const error = await captureError(
        http.request().get(server.url).maxResponseSize(ByteSize.fromKilobytes(1)).retry({ retries: 3 }).execute()
      )

      expect(error).toBeInstanceOf(ApiBadGatewayException)
      expect(error.statusCode).toBe(502)
      expect(error.message).toContain('maxContentLength')
      expect(server.attempts).toHaveLength(1)
    })

    test('when an oversized response has a retryable 5xx status, should not retry it', async () => {
      // Size errors have no response, so their fallback status (500) and the converted one (502)
      // are both in the retry list here: the size check must win anyway.
      server.alwaysReply({ status: 200, body: bodyOfSize(ByteSize.fromKilobytes(4)) })

      await captureError(
        http
          .request()
          .get(server.url)
          .maxResponseSize(ByteSize.fromKilobytes(1))
          .retry({ retries: 3, retryStatusCodes: [500, 502] })
          .execute()
      )

      expect(server.attempts).toHaveLength(1)
    })

    test('when a gzip response is decompressed, should enforce the limit on its decompressed size', async () => {
      // Highly compressible: tiny on the wire, 64KB once decompressed.
      server.alwaysReply({ status: 200, body: bodyOfSize(ByteSize.fromKilobytes(64)), gzip: true })

      const error = await captureError(
        http
          .request()
          .get(server.url)
          .maxResponseSize(ByteSize.fromKilobytes(16))
          .execute()
      )

      expect(error.statusCode).toBe(502)
    })

    test('when the request overrides the response limit, should allow a larger limit than the instance default', async () => {
      const service = new HttpService(logger, { maxContentLength: ByteSize.fromKilobytes(1) })
      server.alwaysReply({ status: 200, body: bodyOfSize(ByteSize.fromKilobytes(4)) })

      const instanceError = await captureError(service.request().get(server.url).execute())
      const result = await service
        .request()
        .get(server.url)
        .maxResponseSize(ByteSize.fromKilobytes(8))
        .execute()

      expect(instanceError.statusCode).toBe(502)
      expect(result).toEqual(bodyOfSize(ByteSize.fromKilobytes(4)))
    })

    test('when the limit is configured through the verb options, should apply it', async () => {
      server.alwaysReply({ status: 200, body: bodyOfSize(ByteSize.fromKilobytes(4)) })

      const error = await captureError(
        http.request().get(server.url, { maxContentLength: ByteSize.fromKilobytes(1) }).execute()
      )

      expect(error.statusCode).toBe(502)
    })

    test('when a request body exceeds the limit, should fail with 500 without sending or retrying it', async () => {
      server.alwaysReply({ status: 503 })

      const error = await captureError(
        http
          .request()
          .post(server.url, bodyOfSize(ByteSize.fromKilobytes(4)))
          .maxRequestSize(ByteSize.fromKilobytes(1))
          .retry({ retries: 3 })
          .execute()
      )

      expect(error).toBeInstanceOf(ApiInternalServerException)
      expect(error.message).toContain('maxBodyLength')
      expect(server.attempts).toHaveLength(0)
      // The body never reaches the server, so the retry is only observable through the logs.
      expect(logger.warn).not.toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('Retry scheduled') })
      )
    })

    it.each([Infinity, -1])('should allow an unlimited size with %p and log a warning', async (unlimited) => {
      const service = new HttpService(logger, { maxContentLength: ByteSize.fromKilobytes(1) })
      server.alwaysReply({ status: 200, body: bodyOfSize(ByteSize.fromKilobytes(4)) })

      const result = await service
        .request()
        .post(server.url, bodyOfSize(ByteSize.fromKilobytes(1)))
        .maxResponseSize(unlimited)
        .maxRequestSize(unlimited)
        .execute()

      expect(result).toEqual(bodyOfSize(ByteSize.fromKilobytes(4)))
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'HTTP request without payload size limit',
          metadata: expect.objectContaining({ unlimited: ['response', 'request'], url: server.url, method: 'POST' })
        })
      )
    })

    test('when an unlimited request is retried, should log the warning only once', async () => {
      server.replyWith({ status: 503 }).alwaysReply({ status: 200, body: { ok: true } })

      await http.request().get(server.url).maxResponseSize(Infinity).retry({ retries: 1 }).execute()

      const warnings = (logger.warn as jest.Mock).mock.calls.filter(
        ([log]) => log.message === 'HTTP request without payload size limit'
      )
      expect(server.attempts).toHaveLength(2)
      expect(warnings).toHaveLength(1)
    })

    test('when response limits are configured, should not log the unlimited warning', async () => {
      await http.request().get(server.url).execute()

      expect(logger.warn).not.toHaveBeenCalledWith(
        expect.objectContaining({ message: 'HTTP request without payload size limit' })
      )
    })

    it.each([0, -2, 1.5, NaN])('should reject an invalid size %p', (invalid) => {
      expect(() => http.request().get(server.url).maxResponseSize(invalid)).toThrow(ApiInternalServerException)
      expect(() => http.request().get(server.url).maxRequestSize(invalid)).toThrow(ApiInternalServerException)
    })
  })

  describe('response schema', () => {
    const UserSchema = InputValidator.object({
      id: InputValidator.number(),
      name: InputValidator.string().transform((name) => name.toUpperCase())
    })

    test('when the response matches the schema, should return its transformed value without unknown keys', async () => {
      server.alwaysReply({ status: 200, body: { id: 1, name: 'john', extra: 'ignored' } })

      const user: { id: number; name: string } = await http.request().get(server.url).schema(UserSchema).execute()

      expect(user).toEqual({ id: 1, name: 'JOHN' })
    })

    test('when the response fails schema validation, should throw 502 with issues in upstreamIssues only', async () => {
      server.alwaysReply({ status: 200, body: { id: 'not-a-number', name: 'john' } })

      const error = await captureError(http.request().get(server.url).schema(UserSchema).execute())

      expect(error).toBeInstanceOf(ApiBadGatewayException)
      expect(error.statusCode).toBe(502)
      expect(error.parameters.details).toBeUndefined()
      expect(error.parameters).toEqual(
        expect.objectContaining({
          url: server.url,
          method: 'GET',
          status: 200,
          upstreamIssues: [expect.objectContaining({ path: ['id'], code: 'invalid_type' })]
        })
      )
    })

    test('when the response does not match the schema, should not retry', async () => {
      server.alwaysReply({ status: 200, body: { id: 'not-a-number', name: 'john' } })

      await captureError(http.request().get(server.url).retry({ retries: 3 }).schema(UserSchema).execute())

      expect(server.attempts).toHaveLength(1)
    })

    test('when the upstream returns an error response, should not validate its body against the success schema', async () => {
      server.alwaysReply({ status: 404, body: { message: 'user not found' } })

      const error = await captureError(http.request().get(server.url).schema(UserSchema).execute())

      expect(error).toBeInstanceOf(ApiNotFoundException)
      expect(error.message).toBe('user not found')
    })

    test('when a retry succeeds, should validate the successful response', async () => {
      server.replyWith({ status: 503 }).alwaysReply({ status: 200, body: { id: 1, name: 'john' } })

      const user = await http.request().get(server.url).retry({ retries: 1 }).schema(UserSchema).execute()

      expect(user).toEqual({ id: 1, name: 'JOHN' })
      expect(server.attempts).toHaveLength(2)
    })

    test('when the response schema has async refinements, should validate them', async () => {
      const AsyncSchema = InputValidator.object({ id: InputValidator.number() }).refine(
        async ({ id }) => id > 0,
        'id must be positive'
      )
      server.alwaysReply({ status: 200, body: { id: -1 } })

      const error = await captureError(http.request().get(server.url).schema(AsyncSchema).execute())

      expect(error.statusCode).toBe(502)
    })

    test('when the request verb changes, should reset the response schema', async () => {
      server.alwaysReply({ status: 200, body: { anything: true } })

      const result = await http.request().get(server.url).schema(UserSchema).post(server.url, {}).execute()

      expect(result).toEqual({ anything: true })
    })

    test('when deriving a builder, should not affect its source builder', async () => {
      server.alwaysReply({ status: 200, body: { anything: true } })
      const base = http.request().get(server.url)

      await captureError(base.schema(UserSchema).execute())
      const result = await base.execute()

      expect(result).toEqual({ anything: true })
    })
  })

  describe('builder composition', () => {
    test('when deriving multiple builders from the same base, should not leak headers, timeout, or retry settings', async () => {
      server.alwaysReply({ status: 503, delayMs: 400 })
      const base = http.request().headers({ 'x-base': 'base' })

      const derivedWithOverrides = base.get(`${server.url}/a`).header('x-a', 'a').timeout(200).retry({ retries: 2 })
      const derivedPlain = base.get(`${server.url}/b`)

      const errorA = await captureError(derivedWithOverrides.execute())
      const errorB = await captureError(derivedPlain.execute())

      const attemptsA = server.attempts.filter((attempt) => attempt.path === '/a')
      const attemptsB = server.attempts.filter((attempt) => attempt.path === '/b')

      expect(errorA.statusCode).toBe(408)
      expect(attemptsA).toHaveLength(3)
      expect(attemptsA[0].headers['x-a']).toBe('a')

      // /b did not inherit the 200ms timeout, the retry or the x-a header.
      expect(errorB.statusCode).toBe(503)
      expect(attemptsB).toHaveLength(1)
      expect(attemptsB[0].headers['x-base']).toBe('base')
      expect(attemptsB[0].headers['x-a']).toBeUndefined()
    })

    test('when switching verbs on the base builder, should keep its configured options', async () => {
      server.replyWith({ status: 503 }).alwaysReply({ status: 200, body: { ok: true } })

      const result = await http
        .request()
        .header('x-base', 'base')
        .retry({ retries: 1 })
        .get(`${server.url}/first`)
        .post(`${server.url}/second`, { id: 1 })
        .execute()

      expect(result).toEqual({ ok: true })
      expect(server.attempts).toHaveLength(2)
      server.attempts.forEach((attempt) => {
        expect(attempt.method).toBe('POST')
        expect(attempt.path).toBe('/second')
        expect(attempt.headers['x-base']).toBe('base')
      })
    })
  })
})
