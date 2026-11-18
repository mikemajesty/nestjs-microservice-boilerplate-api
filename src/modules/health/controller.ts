/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/modules/controller.md
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { Controller, Get, Res } from '@nestjs/common'
import type { FastifyReply } from 'fastify'
import os from 'os'

import { ISecretsAdapter } from '@/infra/secrets'
import { CryptoUtils } from '@/utils/crypto'
import { Public } from '@/utils/decorators'

import { version } from '../../../package.json'
import { IHealthAdapter } from './service'
import {
  HealthStatus,
  LivenessOutput,
  MetricsOutput,
  ReadinessOutput,
  RootHealthOutput,
  StartupOutput
} from './types'

// Static page, copied to dist by the SWC build (`copyFiles`). Read once at module load.
const DASHBOARD_TEMPLATE = readFileSync(join(__dirname, 'dashboard.html'), 'utf8')

@Controller('health')
@Public()
export class HealthController {
  constructor(
    private readonly service: IHealthAdapter,
    private readonly secrets: ISecretsAdapter
  ) {}

  @Get('dashboard')
  getDashboard(@Res({ passthrough: true }) reply: FastifyReply): string {
    // The global helmet CSP only allows 'self' scripts. The page ships inline
    // CSS/JS, so this response gets its own stricter policy with a per-request nonce.
    const nonce = CryptoUtils.generateRandomBase64()
    const csp = `default-src 'self'; script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}'; frame-ancestors 'none'`
    reply.type('text/html').header('Content-Security-Policy', csp)
    return DASHBOARD_TEMPLATE.replaceAll('{{nonce}}', nonce)
  }

  @Get('ready')
  async getReadiness(@Res({ passthrough: true }) reply: FastifyReply): Promise<ReadinessOutput> {
    const [mongo, postgres, redis] = await Promise.all([
      this.service.checkMongo(),
      this.service.checkPostgres(),
      this.service.checkRedis()
    ])

    const isReady = [mongo, postgres, redis].every((check) => check.status === HealthStatus.UP)
    if (!isReady) {
      reply.code(503)
    }

    return {
      status: isReady ? HealthStatus.UP : HealthStatus.DOWN,
      version,
      timestamp: new Date().toISOString(),
      dependencies: { mongo, postgres, redis }
    }
  }

  @Get('metrics')
  async getMetrics(@Res({ passthrough: true }) reply: FastifyReply): Promise<MetricsOutput> {
    const runtime = this.service.getRuntimeWindow()
    const memory = this.service.getMemory()

    const [cpu, connections, mongo, postgresConnection, databaseSizeBytes, redis] = await Promise.all([
      this.service.getHostCpu(),
      this.service.getHttpConnections(reply.server.server),
      this.service.getMongoServerStatus(),
      this.service.getPostgresConnections(),
      this.service.getPostgresDatabaseSize(),
      this.service.getRedisInfo()
    ])

    reply.header('Cache-Control', 'no-store')
    return {
      version,
      timestamp: new Date().toISOString(),
      window: { seconds: runtime.seconds },
      process: {
        hostname: os.hostname(),
        pid: process.pid,
        nodeVersion: process.version,
        environment: this.secrets.ENV,
        uptimeSeconds: Math.round(process.uptime()),
        cpu: runtime.processCpu
      },
      memory,
      eventLoopLag: runtime.eventLoopLag,
      gc: runtime.gc,
      network: { connections },
      cpu,
      mongo,
      postgres: { connection: postgresConnection, databaseSizeBytes },
      redis
    }
  }

  @Get(['live'])
  async getLiveness(): Promise<LivenessOutput> {
    return {
      status: HealthStatus.UP,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }
  }

  @Get('startup')
  async getStartup(@Res({ passthrough: true }) reply: FastifyReply): Promise<StartupOutput> {
    try {
      const [mongo, postgres, redis] = await Promise.all([
        this.service.checkMongo(),
        this.service.checkPostgres(),
        this.service.checkRedis()
      ])
      const mongoState = mongo.status
      const postgresState = postgres.status
      const redisState = redis.status
      const basicSystemsConnected =
        mongoState === HealthStatus.UP && postgresState === HealthStatus.UP && redisState === HealthStatus.UP

      if (!basicSystemsConnected) {
        reply.code(503)
      }

      const output: StartupOutput = {
        status: basicSystemsConnected ? HealthStatus.UP : HealthStatus.DOWN,
        timestamp: new Date().toISOString(),
        phase: 'startup',
        connections: {
          mongo: mongoState === HealthStatus.UP ? 'connected' : 'disconnected',
          postgres: postgresState === HealthStatus.UP ? 'connected' : 'disconnected',
          redis: redisState === HealthStatus.UP ? 'connected' : 'disconnected'
        },
        message: basicSystemsConnected ? 'All basic connections established' : 'Missing basic connections'
      }

      return output
    } catch {
      reply.code(503)
      // `connections` is intentionally omitted here: the check failed before
      // connection states were determined. StartupOutput declares it optional.
      const output: StartupOutput = {
        status: HealthStatus.DOWN,
        timestamp: new Date().toISOString(),
        phase: 'startup',
        error: 'Startup check failed - initialization incomplete',
        message: 'Application still initializing'
      }

      return output
    }
  }
}

@Controller()
@Public()
export class RootHealthController {
  @Get()
  async getRootHealth(): Promise<RootHealthOutput> {
    return {
      status: HealthStatus.UP,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }
  }
}
