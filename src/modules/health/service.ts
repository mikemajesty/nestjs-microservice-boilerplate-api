import type { Server } from 'node:net'

import { Redis } from 'ioredis'
import { Connection } from 'mongoose'
import ping from 'ping'
import systeminformation from 'systeminformation'
import { DataSource } from 'typeorm'
import v8 from 'v8'

import { ICacheAdapter } from '@/infra/cache'
import { ILoggerAdapter } from '@/infra/logger'
import { ISecretsAdapter } from '@/infra/secrets'
import { ByteSize } from '@/utils/byte-size'

import { ApiInternalServerException } from './../../utils/exception'
import {
  CacheMemoryOutput,
  HealthStatus,
  Load,
  MemoryOutput,
  MongoConnectionOutput,
  PostgresConnectionOutput
} from './types'

export class HealthService implements IHealthAdapter {
  postgres!: DataSource
  mongo!: Connection
  redis!: ICacheAdapter<Redis>

  constructor(
    private readonly logger: ILoggerAdapter,
    private readonly secrets: ISecretsAdapter
  ) {}

  async getPostgresDatabaseSize(): Promise<string | null> {
    try {
      const result = await this.postgres.query(`
        SELECT COALESCE(SUM(pg_database_size(datname)), 0)::text AS "databaseSizeBytes"
        FROM pg_database;
      `)

      return String(result[0].databaseSizeBytes)
    } catch (error) {
      this.logError(error, `${HealthService.name}.getPostgresDatabaseSize`)
      return null
    }
  }

  async getMongoMemory(): Promise<CacheMemoryOutput> {
    try {
      if (this.mongo.readyState !== 1 || !this.mongo.db) {
        return { used: null, limit: null }
      }

      const status = await this.mongo.db.command({ serverStatus: 1 })

      const cache = status.wiredTiger?.cache
      if (!cache) {
        if (this.secrets.IS_DOCUMENTDB) {
          return { used: null, limit: null }
        }

        throw new ApiInternalServerException('WiredTiger cache not available - check MongoDB version/config')
      }

      const formatMemory = (bytes: unknown): string | null =>
        typeof bytes === 'number' && Number.isFinite(bytes) ? `${ByteSize.toMegabytes(bytes).toFixed(2)} MB` : null

      return {
        used: formatMemory(cache['bytes currently in the cache']),
        limit: formatMemory(cache['maximum bytes configured'])
      }
    } catch (error) {
      this.logError(error, `${HealthService.name}.getMongoMemory`)
      return { used: null, limit: null }
    }
  }

  async getMongoConnections(): Promise<MongoConnectionOutput | null> {
    try {
      if (this.mongo.readyState !== 1) {
        return null
      }

      if (this.mongo.db) {
        const status = await this.mongo.db.command({ serverStatus: 1 })

        return status.connections ?? null
      }
      return null
    } catch (error) {
      this.logError(error, `${HealthService.name}.getMongoConnections`)
      return null
    }
  }

  async getPostgresConnections(): Promise<PostgresConnectionOutput | null> {
    try {
      const manager = this.postgres.manager
      const [connections] = await manager.query(`
        SELECT
          COUNT(*) FILTER (WHERE backend_type = 'client backend')::int AS current,
          COUNT(*) FILTER (
            WHERE backend_type = 'client backend' AND state = 'active'
          )::int AS active,
          GREATEST(
            current_setting('max_connections')::int -
            current_setting('superuser_reserved_connections')::int -
            COUNT(*) FILTER (WHERE backend_type = 'client backend'),
            0
          )::int AS available
        FROM pg_stat_activity;
      `)

      return {
        current: Number(connections.current),
        available: Number(connections.available),
        active: Number(connections.active)
      }
    } catch (error) {
      this.logError(error, `${HealthService.name}.getPostgresConnections`)
      return null
    }
  }

  getMemoryUsageInMB() {
    const processMemory = process.memoryUsage()
    const heapStats = v8.getHeapStatistics()
    return {
      process: {
        usedRam: `${ByteSize.toMegabytes(processMemory.rss).toFixed(2)} MB`,
        heapTotal: `${ByteSize.toMegabytes(processMemory.heapTotal).toFixed(2)} MB`,
        heapUsed: `${ByteSize.toMegabytes(processMemory.heapUsed).toFixed(2)} MB`,
        external: `${ByteSize.toMegabytes(processMemory.external).toFixed(2)} MB`
      },
      v8: {
        totalHeapSize: `${ByteSize.toMegabytes(heapStats.total_heap_size).toFixed(2)} MB`,
        usedHeapSize: `${ByteSize.toMegabytes(heapStats.used_heap_size).toFixed(2)} MB`,
        executableHeapSize: `${ByteSize.toMegabytes(heapStats.total_heap_size_executable).toFixed(2)} MB`,
        heapSizeLimit: `${ByteSize.toMegabytes(heapStats.heap_size_limit).toFixed(2)} MB`
      }
    }
  }

  getLoadAvarage(time: number, numCpus: number): Load {
    const getStatus = (percentage: number) => {
      const thresholds = [
        { limit: 60, status: 'healthy 🟢' },
        { limit: 80, status: 'warning ⚠️' },
        { limit: Infinity, status: 'overloaded 🔴' }
      ]
      return thresholds.find((t) => percentage < t.limit)?.status || 'overloaded 🔴'
    }

    const percentage = (time / numCpus) * 100
    const status = getStatus(percentage)

    if (status !== 'healthy 🟢') {
      this.logger.warn({
        message: `CPU ${status} - Load: ${time.toFixed(2)}, CPUs: ${numCpus}, Usage: ${percentage.toFixed(1)}%`,
        metadata: { context: HealthService.name }
      })
    }

    return { load: time, status }
  }

  getHttpConnections(server: Server): Promise<number | null> {
    return new Promise((resolve) => {
      server.getConnections((error, count) => {
        if (error) {
          this.logger.warn({
            message: 'Unable to collect HTTP connection count',
            metadata: { context: HealthService.name, error: error.message }
          })
          resolve(null)
          return
        }

        resolve(count)
      })
    })
  }

  async getLatency(host = '8.8.8.8') {
    try {
      const res = await ping.promise.probe(host, { timeout: 200 })
      if (!res.alive || !res.time) {
        return 'N/A'
      }
      const latency = [
        { latency: 20, status: 'Excellent' },
        { latency: 100, status: 'Acceptable' },
        { latency: 300, status: 'Poor' }
      ].find((l) => Number(res.time) < l.latency)
      return `${res.time}ms ${latency?.status ?? 'Critical'}`
    } catch (error) {
      this.logError(error, `${HealthService.name}.getLatency`)
      return 'Critical'
    }
  }

  async getCPUCore() {
    try {
      return await systeminformation.currentLoad()
    } catch (error) {
      this.logError(error, `${HealthService.name}.getCPUCore`)
      return { cpus: [] }
    }
  }

  async getPostgresStatus() {
    try {
      const result = await this.postgres.query('SELECT 1')

      return result.length > 0 ? HealthStatus.UP : HealthStatus.DOWN
    } catch (error) {
      this.logError(error, `${HealthService.name}.getPostgresStatus`)
      return HealthStatus.DOWN
    }
  }

  async getMongoStatus(): Promise<HealthStatus> {
    try {
      if (this.mongo.readyState !== 1 || !this.mongo.db) {
        return HealthStatus.DOWN
      }

      await this.mongo.db.command({ ping: 1 })
      return HealthStatus.UP
    } catch (error) {
      this.logError(error, `${HealthService.name}.getMongoStatus`)
      return HealthStatus.DOWN
    }
  }

  async getRedisStatus() {
    try {
      const status = await this.redis.ping()
      return status === 'PONG' ? HealthStatus.UP : HealthStatus.DOWN
    } catch (error) {
      this.logError(error, `${HealthService.name}.getRedisStatus`)
      return HealthStatus.DOWN
    }
  }

  private logError(error: unknown, context: string): void {
    this.logger.error(
      new ApiInternalServerException('Health check failed', {
        context,
        cause: error
      })
    )
  }
}

/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/modules/adapter.md
 */

export abstract class IHealthAdapter {
  abstract mongo: Connection
  abstract postgres: DataSource
  abstract redis: ICacheAdapter<Redis>
  abstract getMongoStatus(): Promise<HealthStatus>
  abstract getRedisStatus(): Promise<HealthStatus>
  abstract getPostgresStatus(): Promise<HealthStatus>
  abstract getMemoryUsageInMB(): MemoryOutput
  abstract getLoadAvarage(time: number, numCpus: number): Load
  abstract getHttpConnections(server: Server): Promise<number | null>
  abstract getLatency(host?: string): Promise<string>
  abstract getMongoConnections(): Promise<MongoConnectionOutput | null>
  abstract getPostgresConnections(): Promise<PostgresConnectionOutput | null>
  abstract getPostgresDatabaseSize(): Promise<string | null>
  abstract getMongoMemory(): Promise<CacheMemoryOutput>
  abstract getCPUCore(): Promise<{ cpus: { load: number }[] }>
}
