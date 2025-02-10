import { exec } from 'child_process';
import { Connection } from 'mongoose';
import ping from 'ping';
import { RedisClientType } from 'redis';
import { DataSource } from 'typeorm';
import v8 from 'v8';

import { ICacheAdapter } from '@/infra/cache';
import { ErrorType, ILoggerAdapter } from '@/infra/logger';
import { ISecretsAdapter } from '@/infra/secrets';
import { ApiInternalServerException } from '@/utils/exception';

import { IHealthAdapter } from './adapter';
import { HealthStatus, Load } from './types';

export class HealthService implements IHealthAdapter {
  postgres!: DataSource;
  mongo!: Connection;
  redis!: ICacheAdapter<RedisClientType>;

  constructor(
    private readonly logger: ILoggerAdapter,
    private readonly secret: ISecretsAdapter
  ) {}

  getMemoryUsageInMB() {
    const processMemory = process.memoryUsage();
    const heapStats = v8.getHeapStatistics();

    return {
      process: {
        usedRam: `${this.bytesToMB(processMemory.rss)} MB`,
        heapTotal: `${this.bytesToMB(processMemory.heapTotal)} MB`,
        heapUsed: `${this.bytesToMB(processMemory.heapUsed)} MB`,
        external: `${this.bytesToMB(processMemory.external)} MB`
      },
      v8: {
        totalHeapSize: `${this.bytesToMB(heapStats.total_heap_size)} MB`,
        usedHeapSize: `${this.bytesToMB(heapStats.used_heap_size)} MB`,
        executableHeapSize: `${this.bytesToMB(heapStats.total_heap_size_executable)} MB`,
        heapSizeLimit: `${this.bytesToMB(heapStats.heap_size_limit)} MB`
      }
    };
  }

  getLoadAvarage(time: number, numCpus: number): Load {
    const STATUS = time < numCpus ? 'healthy 🟢' : 'overloaded 🔴';
    if (STATUS === 'overloaded 🔴') {
      this.logger.warn({ message: `CPU ${STATUS} `, context: HealthService.name });
    }
    return { load: time, status: STATUS };
  }

  getActiveConnections() {
    return new Promise((resolve, reject) => {
      exec('netstat -an | wc -l', (error, stdout, stderr) => {
        if (error) {
          reject(`Error getting connection: ${stderr}`);
        }
        resolve(parseInt(stdout.trim(), 10));
      });
    });
  }

  async getLatency(host = '8.8.8.8') {
    try {
      const res = await ping.promise.probe(host, { timeout: 200 });
      if (!res.time) {
        return '0ms';
      }
      const latency = [
        { latency: 20, status: 'Excellent' },
        { latency: 100, status: 'Acceptable' },
        { latency: 300, status: 'Poor' }
      ].find((l) => Number(res.time) < l.latency);
      return `${res.time}ms ${latency?.status ?? 'Critical'}`;
    } catch (error) {
      error = this.buildError(error, `${HealthService.name}/getLatency`);
      this.logger.error(error as ErrorType);
      return 'Critical';
    }
  }

  async getPostgresStatus() {
    try {
      const result = await this.postgres.query('SELECT 1');

      return result ? HealthStatus.UP : HealthStatus.DOWN;
    } catch (error) {
      error = this.buildError(error, `${HealthService.name}/postgres`);
      this.logger.error(error as ErrorType);
      return HealthStatus.DOWN;
    }
  }

  getMongoStatus() {
    try {
      return this.mongo.readyState === 1 ? HealthStatus.UP : HealthStatus.DOWN;
    } catch (error) {
      error = this.buildError(error, `${HealthService.name}/mongo`);
      this.logger.error(error as ErrorType);
      return HealthStatus.DOWN;
    }
  }

  async getRedisStatus() {
    try {
      const status = await this.redis.ping();
      return status === 'PONG' ? HealthStatus.UP : HealthStatus.DOWN;
    } catch (error) {
      error = this.buildError(error, `${HealthService.name}/redis`);
      this.logger.error(error as ErrorType);
      return HealthStatus.DOWN;
    }
  }

  private buildError(error: unknown, context: string) {
    if (typeof error === 'string') {
      error = new ApiInternalServerException(error);
    }
    (error as { context: string }).context = context;
    return error;
  }

  private bytesToMB = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2);
  };
}
