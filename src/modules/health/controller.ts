/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/modules/controller.md
 */
import { Controller, Get, Res } from '@nestjs/common'
import type { FastifyReply } from 'fastify'
import os from 'os'

import { Public } from '@/utils/decorators'

import { version } from '../../../package.json'
import { IHealthAdapter } from './service'
import {
  CpuCoreLoad,
  EventLoopLagOutput,
  HealthOutput,
  HealthStatus,
  LivenessOutput,
  PercentFormatted,
  RootHealthOutput,
  StartupOutput
} from './types'

@Controller('health')
@Public()
export class HealthController {
  constructor(private readonly service: IHealthAdapter) {}

  @Get('ready')
  async getReadiness(@Res({ passthrough: true }) reply: FastifyReply): Promise<HealthOutput> {
    const memory = this.service.getMemoryUsageInMB()
    const eventLoopLag: EventLoopLagOutput = this.service.getEventLoopLag()

    const numCpus = os.cpus().length
    const [lastMinute, lastFiveMinutes, lastFifteenMinutes] = os.loadavg()

    const [
      mongoState,
      postgresState,
      redisState,
      cpuList,
      mongoConnections,
      mongoMemory,
      postgresDatabaseSizeBytes,
      postgresConnections,
      latency,
      connections
    ] = await Promise.all([
      this.service.getMongoStatus(),
      this.service.getPostgresStatus(),
      this.service.getRedisStatus(),
      this.service.getCPUCore(),
      this.service.getMongoConnections(),
      this.service.getMongoMemory(),
      this.service.getPostgresDatabaseSize(),
      this.service.getPostgresConnections(),
      this.service.getLatency(),
      this.service.getHttpConnections(reply.server.server)
    ])

    const cores: CpuCoreLoad[] = cpuList.cpus.map((core, index) => ({
      core: index + 1,
      // `core.load` comes from systeminformation as a number (0–100).
      // PercentFormatted is `${number}%`, so build the template literal explicitly.
      load: `${core.load.toFixed(2)}%` as PercentFormatted
    }))

    const cpu = {
      cpus: numCpus,
      globalAverage: {
        lastMinute: this.service.getLoadAvarage(lastMinute, numCpus),
        lastFiveMinutes: this.service.getLoadAvarage(lastFiveMinutes, numCpus),
        lastFifteenMinutes: this.service.getLoadAvarage(lastFifteenMinutes, numCpus)
      },
      cores
    }

    const isReady =
      mongoState === HealthStatus.UP && postgresState === HealthStatus.UP && redisState === HealthStatus.UP

    if (!isReady) {
      reply.code(503)
    }

    const output: HealthOutput = {
      server: isReady ? HealthStatus.UP : HealthStatus.DOWN,
      version,
      mongo: {
        status: mongoState,
        connection: mongoConnections,
        memory: mongoMemory
      },
      postgres: {
        status: postgresState,
        connection: postgresConnections,
        databaseSizeBytes: postgresDatabaseSizeBytes
      },
      redisState,
      network: {
        // getLatency already returns LatencyFormatted; String() was redundant.
        latency,
        connections
      },
      memory,
      cpu,
      eventLoopLag
    }

    return output
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
      const [mongoState, postgresState, redisState] = await Promise.all([
        this.service.getMongoStatus(),
        this.service.getPostgresStatus(),
        this.service.getRedisStatus()
      ])
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
