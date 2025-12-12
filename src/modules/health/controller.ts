import { Controller, Get } from '@nestjs/common'
import os from 'os'

import { ILoggerAdapter } from '@/infra/logger'

import { version } from '../../../package.json'
import { IHealthAdapter } from './adapter'
import { HealthOutput, HealthStatus } from './types'

@Controller()
export class HealthController {
  constructor(
    private readonly service: IHealthAdapter,
    private readonly logger: ILoggerAdapter
  ) {}

  @Get(['/health', '/'])
  async getHealth(): Promise<HealthOutput> {
    const memory = this.service.getMemoryUsageInMB()

    const numCpus = os.cpus().length
    const [lastMinute, lastFiveMinutes, lastFifteenMinutes] = os.loadavg()

    const mongoState = this.service.getMongoStatus()
    const postgresState = await this.service.getPostgresStatus()
    const redisState = await this.service.getRedisStatus()

    const cpuList = await this.service.getCPUCore()

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

    const mongoConnections = await this.service.getMongoConnections()
    const mongoMemory = await this.service.getMongoMemory()

    const postgresMemory = await this.service.getPostgresMemory()
    const postgresConnections = await this.service.getPostgresConnections()

    const latency = await this.service.getLatency()
    const connections = await this.service.getActiveConnections()

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

    this.logger.info({ message: 'Server Up!', context: HealthController.name, obj: output })

    return output
  }
}
