import { Controller, Get } from '@nestjs/common'
import os from 'os'


import { version } from '../../../package.json'
import { IHealthAdapter } from './adapter'
import { HealthOutput, HealthStatus } from './types'

@Controller()
export class HealthController {
  constructor(
    private readonly service: IHealthAdapter,
  ) {}

  @Get(['/health', '/'])
  async getHealth(): Promise<HealthOutput> {
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
}
