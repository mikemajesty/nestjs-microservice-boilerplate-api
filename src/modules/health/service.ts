import type { Server } from 'node:net'
import { monitorEventLoopDelay } from 'node:perf_hooks'

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
  ByteSizeFormatted,
  EventLoopLagOutput,
  HealthStatus,
  HeapSpaceOutput,
  LatencyFormatted,
  Load,
  LoadStatus,
  MemoryOutput,
  MongoCacheMemoryOutput,
  MongoConnectionOutput,
  PostgresConnectionOutput
} from './types'

export class HealthService implements IHealthAdapter {
  postgres!: DataSource
  mongo!: Connection
  redis!: ICacheAdapter<Redis>

  private readonly eventLoopHistogram = monitorEventLoopDelay({ resolution: 20 })

  constructor(
    private readonly logger: ILoggerAdapter,
    private readonly secrets: ISecretsAdapter
  ) {
    this.eventLoopHistogram.enable()
  }

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

  async getMongoMemory(): Promise<MongoCacheMemoryOutput> {
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

      const formatMemory = (bytes: unknown): ByteSizeFormatted | null =>
        typeof bytes === 'number' && Number.isFinite(bytes)
          ? (`${ByteSize.toMegabytes(bytes).toFixed(2)} MB` as ByteSizeFormatted)
          : null

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

  getMemoryUsageInMB(): MemoryOutput {
    const processMemory = process.memoryUsage()
    const heapStats = v8.getHeapStatistics()
    const heapSpaces = v8.getHeapSpaceStatistics()

    const toMb = (bytes: number): ByteSizeFormatted =>
      `${ByteSize.toMegabytes(bytes).toFixed(2)} MB` as ByteSizeFormatted

    return {
      process: {
        // rss — total process memory. If it grows while heapUsed is flat, look outside
        // the JS heap: Buffers, unread streams, native modules.
        usedRam: toMb(processMemory.rss),
        // Memory reserved by V8 for the heap. Follows heapUsed up and recedes slowly.
        heapTotal: toMb(processMemory.heapTotal),
        // Memory held by live JS objects. Leaks in application code surface here.
        heapUsed: toMb(processMemory.heapUsed),
        // Native memory outside the JS heap (Buffers, etc.).
        external: toMb(processMemory.external),
        // Subset of `external`: ArrayBuffers currently allocated.
        arrayBuffers: toMb(processMemory.arrayBuffers)
      },
      v8: {
        totalHeapSize: toMb(heapStats.total_heap_size),
        // Redundant with process.heapUsed, kept for compatibility.
        usedHeapSize: toMb(heapStats.used_heap_size),
        executableHeapSize: toMb(heapStats.total_heap_size_executable),
        // Effective V8 ceiling. Compare against the container memory limit:
        // if the container limit is lower, the kernel kills the process (OOMKilled)
        // instead of V8 raising a catchable heap-limit error.
        heapSizeLimit: toMb(heapStats.heap_size_limit)
      },
      // Per-space breakdown. A long-lived leak shows up in `old_space`;
      // large strings/arrays in `large_object_space`; a busy but flat `new_space`
      // is just allocation churn, not a leak.
      heapSpaces: heapSpaces.map<HeapSpaceOutput>((space) => ({
        name: space.space_name,
        size: toMb(space.space_size),
        used: toMb(space.space_used_size),
        available: toMb(space.space_available_size)
      }))
    }
  }

  getEventLoopLag(): EventLoopLagOutput {
    // Values are in nanoseconds; convert to milliseconds for the output.
    // Reset after reading so each snapshot reflects a recent window.
    const toMs = (ns: number): number => Number((ns / 1_000_000).toFixed(2))

    const output: EventLoopLagOutput = {
      meanMs: toMs(this.eventLoopHistogram.mean),
      maxMs: toMs(this.eventLoopHistogram.max),
      p99Ms: toMs(this.eventLoopHistogram.percentile(99))
    }

    this.eventLoopHistogram.reset()
    return output
  }

  getLoadAvarage(time: number, numCpus: number): Load {
    const getStatus = (percentage: number): LoadStatus => {
      const thresholds: { limit: number; status: LoadStatus }[] = [
        { limit: 60, status: 'healthy 🟢' },
        { limit: 80, status: 'warning ⚠️' },
        { limit: Infinity, status: 'overloaded 🔴' }
      ]
      return thresholds.find((t) => percentage < t.limit)?.status ?? 'overloaded 🔴'
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

  async getLatency(host = '8.8.8.8'): Promise<LatencyFormatted> {
    try {
      const res = await ping.promise.probe(host, { timeout: 1 })
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

  async getCPUCore(): Promise<{ cpus: { load: number }[] }> {
    try {
      return await systeminformation.currentLoad()
    } catch (error) {
      this.logError(error, `${HealthService.name}.getCPUCore`)
      return { cpus: [] }
    }
  }

  async getPostgresStatus(): Promise<HealthStatus> {
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

  async getRedisStatus(): Promise<HealthStatus> {
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

export abstract class IHealthAdapter {
  abstract mongo: Connection
  abstract postgres: DataSource
  abstract redis: ICacheAdapter<Redis>
  abstract getMongoStatus(): Promise<HealthStatus>
  abstract getRedisStatus(): Promise<HealthStatus>
  abstract getPostgresStatus(): Promise<HealthStatus>
  abstract getMemoryUsageInMB(): MemoryOutput
  abstract getEventLoopLag(): EventLoopLagOutput
  abstract getLoadAvarage(time: number, numCpus: number): Load
  abstract getHttpConnections(server: Server): Promise<number | null>
  abstract getLatency(host?: string): Promise<LatencyFormatted>
  abstract getMongoConnections(): Promise<MongoConnectionOutput | null>
  abstract getPostgresConnections(): Promise<PostgresConnectionOutput | null>
  abstract getPostgresDatabaseSize(): Promise<string | null>
  abstract getMongoMemory(): Promise<MongoCacheMemoryOutput>
  abstract getCPUCore(): Promise<{ cpus: { load: number }[] }>
}
