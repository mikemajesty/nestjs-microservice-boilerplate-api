import { Controller, Get } from '@nestjs/common';
import os from 'os';

import { version } from '../../../package.json';
import { IHealthAdapter } from './adapter';
import { HealthOutput, HealthStatus } from './types';

@Controller()
export class HealthController {
  constructor(private readonly service: IHealthAdapter) {}

  @Get(['/health', '/'])
  async getHealth(): Promise<HealthOutput> {
    const memory = this.service.getMemoryUsageInMB();

    const numCpus = os.cpus().length;
    const [lastMinute, lastFiveMinutes, lastFifteenMinutes] = os.loadavg();

    const mongoState = this.service.getMongoStatus();
    const postgresState = await this.service.getPostgresStatus();
    const redisState = await this.service.getRedisStatus();

    const cpuList = await this.service.getCPUCore();

    const cpuStatus = [];
    for (const [index, core] of cpuList.cpus.entries()) {
      cpuStatus.push({ core: index + 1, load: `${core.load.toFixed(2)}%` });
    }

    const cpu = {
      cpus: numCpus,
      globalAvarage: {
        lastMinute: this.service.getLoadAvarage(lastMinute, numCpus),
        lastFiveMinutes: this.service.getLoadAvarage(lastFiveMinutes, numCpus),
        lastFifteenMinutes: this.service.getLoadAvarage(lastFifteenMinutes, numCpus)
      },
      cores: cpuStatus
    };

    const mongoConnections = await this.service.getMongoConnections();
    const postgresConnections = await this.service.getPostgresConnections();

    const latency = await this.service.getLatency();
    const connections = await this.service.getActiveConnections();

    return {
      server: HealthStatus.UP,
      version,
      mongo: {
        status: mongoState,
        connection: mongoConnections
      },
      postgres: {
        status: postgresState,
        connection: postgresConnections
      },
      redisState,
      network: {
        latency: String(latency),
        connections: Number(connections)
      },
      memory,
      cpu
    };
  }
}
