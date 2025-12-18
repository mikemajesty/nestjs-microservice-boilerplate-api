/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/modules/controller.md
 */
import { Controller, Get } from '@nestjs/common'
import os from 'os'

import { version } from '../../../package.json'
import { IHealthAdapter } from './adapter'
import { HealthOutput, HealthStatus } from './types'

@Controller(`health`)
export class HealthController {
  constructor(private readonly service: IHealthAdapter) {}

  @Get(['ready'])
  async getReadiness(): Promise<HealthOutput> {
    const memory = this.service.getMemoryUsageInMB()

    const numCpus = os.cpus().length
    const [lastMinute, lastFiveMinutes, lastFifteenMinutes] = os.loadavg()

    const [
      mongoState,
      postgresState,
      redisState,
      cpuList,
      mongoConnections,
      mongoMemory,
      postgresMemory,
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
      this.service.getPostgresMemory(),
      this.service.getPostgresConnections(),
      this.service.getLatency(),
      this.service.getActiveConnections()
    ])

    const cpuStatus = []
    for (const [index, core] of cpuList.cpus.entries()) {
      cpuStatus.push({ core: index + 1, load: `${core.load.toFixed(2)}%` })
    }

    const cpu = {
      cpus: numCpus,
      globalAvarage: {
        lastMinute: this.service.getLoadAvarage(lastMinute, numCpus),
        lastFiveMinutes: this.service.getLoadAvarage(lastFiveMinutes, numCpus),
        lastFifteenMinutes: this.service.getLoadAvarage(lastFifteenMinutes, numCpus)
      },
      cores: cpuStatus
    }

    const output = {
      server: HealthStatus.UP,
      version,
      mongo: {
        status: mongoState,
        connection: mongoConnections,
        memory: mongoMemory
      },
      postgres: {
        status: postgresState,
        connection: postgresConnections,
        memory: postgresMemory
      },
      redisState,
      network: {
        latency: String(latency),
        connections: Number(connections)
      },
      memory,
      cpu
    }

    return output
  }

  @Get(['live', '/health', '/'])
  async getLiveness() {
    return {
      status: HealthStatus.UP,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }
  }

  @Get('startup')
  async getStartup() {
    try {
      const isMongoConnected = this.service.mongo.readyState === 1

      const isPostgresInitialized = this.service.postgres.isInitialized

      const isRedisClientReady = !!this.service.redis

      const basicSystemsConnected = isMongoConnected && isPostgresInitialized && isRedisClientReady

      return {
        status: basicSystemsConnected ? HealthStatus.UP : HealthStatus.DOWN,
        timestamp: new Date().toISOString(),
        phase: 'startup',
        connections: {
          mongo: isMongoConnected ? 'connected' : 'disconnected',
          postgres: isPostgresInitialized ? 'initialized' : 'not-initialized',
          redis: isRedisClientReady ? 'client-ready' : 'no-client'
        },
        message: basicSystemsConnected ? 'All basic connections established' : 'Missing basic connections'
      }
    } catch {
      return {
        status: HealthStatus.DOWN,
        timestamp: new Date().toISOString(),
        phase: 'startup',
        error: 'Startup check failed - initialization incomplete',
        message: 'Application still initializing'
      }
    }
  }
}
