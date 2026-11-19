/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/modules/controller.md
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { Controller, Get, Res } from '@nestjs/common'
import type { FastifyReply } from 'fastify'

import { CryptoUtils } from '@/utils/crypto'
import { Public } from '@/utils/decorators'

import { version } from '../../../package.json'
import { IHealthAdapter } from './interfaces'
import {
  ConnectionState,
  DependenciesOutput,
  DependencyCheck,
  HealthStatus,
  LivenessOutput,
  MetricsOutput,
  ReadinessOutput,
  RootHealthOutput,
  StartupOutput
} from './types'

const DASHBOARD_TEMPLATE = readFileSync(join(__dirname, 'dashboard.html'), 'utf8')

const buildLivenessOutput = (): LivenessOutput => ({
  status: HealthStatus.UP,
  timestamp: new Date().toISOString(),
  uptime: process.uptime()
})

@Controller('health')
@Public()
export class HealthController {
  constructor(private readonly service: IHealthAdapter) {}

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
    const { checkedAt, dependencies } = await this.service.checkDependencies()
    const ready = this.isEveryDependencyUp(dependencies)

    if (!ready) {
      reply.code(503)
    }

    return {
      status: ready ? HealthStatus.UP : HealthStatus.DOWN,
      version,
      timestamp: new Date().toISOString(),
      checkedAt,
      dependencies
    }
  }

  @Get('metrics')
  async getMetrics(@Res({ passthrough: true }) reply: FastifyReply): Promise<MetricsOutput> {
    reply.header('Cache-Control', 'no-store')
    return this.service.getMetrics(reply.server.server)
  }

  @Get(['live'])
  async getLiveness(): Promise<LivenessOutput> {
    return buildLivenessOutput()
  }

  @Get('startup')
  async getStartup(@Res({ passthrough: true }) reply: FastifyReply): Promise<StartupOutput> {
    const { checkedAt, dependencies } = await this.service.checkDependencies()
    const { mongo, postgres, redis } = dependencies
    const connected = this.isEveryDependencyUp(dependencies)

    if (!connected) {
      reply.code(503)
    }

    return {
      status: connected ? HealthStatus.UP : HealthStatus.DOWN,
      timestamp: new Date().toISOString(),
      checkedAt,
      phase: 'startup',
      connections: {
        mongo: this.toConnectionState(mongo),
        postgres: this.toConnectionState(postgres),
        redis: this.toConnectionState(redis)
      },
      message: connected ? 'All basic connections established' : 'Missing basic connections'
    }
  }


  private isEveryDependencyUp(dependencies: DependenciesOutput): boolean {
    return Object.values(dependencies).every((check) => check.status === HealthStatus.UP)
  }

  private toConnectionState(check: DependencyCheck): ConnectionState {
    return check.status === HealthStatus.UP ? 'connected' : 'disconnected'
  }
}

@Controller()
@Public()
export class RootHealthController {
  @Get()
  async getRootHealth(): Promise<RootHealthOutput> {
    return buildLivenessOutput()
  }
}
