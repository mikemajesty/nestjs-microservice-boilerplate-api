import type { Server } from 'node:net'
import { constants, monitorEventLoopDelay, performance, PerformanceEntry, PerformanceObserver } from 'node:perf_hooks'

import { OnModuleDestroy } from '@nestjs/common'
import { Redis } from 'ioredis'
import { Connection, ConnectionStates, mongo } from 'mongoose'
import os from 'os'
import systeminformation from 'systeminformation'
import { DataSource } from 'typeorm'
import v8 from 'v8'

import { ICacheAdapter } from '@/infra/cache'
import { ILoggerAdapter } from '@/infra/logger'
import { ISecretsAdapter } from '@/infra/secrets'
import { ByteSize } from '@/utils/byte-size'
import { ApiInternalServerException } from '@/utils/exception'
import { SingleFlight } from '@/utils/single-flight'

import { version } from '../../../package.json'
import { IHealthAdapter, IHealthCacheAdapter } from './interfaces'
import {
  ByteSizeFormatted,
  CpuCoreLoad,
  DependenciesSnapshot,
  DependencyCheck,
  EventLoopLagOutput,
  GcOutput,
  HealthStatus,
  HeapSpaceOutput,
  HostCpuOutput,
  Load,
  LoadStatus,
  MemoryOutput,
  MetricsOutput,
  MongoCacheMemoryOutput,
  MongoConnectionOutput,
  PercentFormatted,
  PostgresConnectionOutput,
  ProcessOutput,
  RedisInfoOutput
} from './types'

// Below the probes' 5s timeoutSeconds: a slow dependency answers DOWN instead of failing the probe.
const CHECK_TIMEOUT_MS = 2000
const EVENT_LOOP_RESOLUTION_MS = 20

// Micro-cache: public health routes cost at most one collection per TTL, however many requests arrive.
// Readiness stays far below the probes' 10s period, so a failure still shows up almost immediately.
const DEPENDENCIES_CACHE_TTL_SECONDS = 2
// Below the dashboard's 30s refresh, so every refresh still gets a new sample.
const METRICS_CACHE_TTL_SECONDS = 5

const toMb = (bytes: number): ByteSizeFormatted => `${ByteSize.toMegabytes(bytes).toFixed(2)} MB` as ByteSizeFormatted
const round = (value: number): number => Number(value.toFixed(2))

const toMbOrNull = (bytes: unknown): ByteSizeFormatted | null => (Number.isFinite(bytes) ? toMb(bytes as number) : null)

const MONGO_STATUS_UNAVAILABLE: MongoServerStatusOutput = { connection: null, memory: { used: null, limit: null } }

type GcPerformanceEntry = PerformanceEntry & { detail?: { kind?: number } }

export class HealthService implements IHealthAdapter, OnModuleDestroy {
  postgres!: DataSource
  mongo!: Connection
  redis!: ICacheAdapter<Redis>
  cache!: IHealthCacheAdapter

  private readonly singleFlight = new SingleFlight()

  private readonly eventLoopHistogram = monitorEventLoopDelay({ resolution: EVENT_LOOP_RESOLUTION_MS })
  private readonly gcObserver: PerformanceObserver
  private gc: GcOutput = HealthService.emptyGc()
  private windowStartedAt = performance.now()
  private cpuBaseline = process.cpuUsage()

  constructor(
    private readonly logger: ILoggerAdapter,
    private readonly secrets: ISecretsAdapter
  ) {
    this.eventLoopHistogram.enable()

    this.gcObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as GcPerformanceEntry[]) {
        const kind = entry.detail?.kind
        this.gc.count++
        if (kind === constants.NODE_PERFORMANCE_GC_MINOR) this.gc.minor++
        if (kind === constants.NODE_PERFORMANCE_GC_MAJOR) this.gc.major++
        this.gc.totalPauseMs += entry.duration
        this.gc.maxPauseMs = Math.max(this.gc.maxPauseMs, entry.duration)
      }
    })
    this.gcObserver.observe({ entryTypes: ['gc'] })
  }

  onModuleDestroy(): void {
    this.eventLoopHistogram.disable()
    this.gcObserver.disconnect()
  }

  checkDependencies(): Promise<DependenciesSnapshot> {
    return this.cached({
      key: 'health:dependencies',
      ttlSeconds: DEPENDENCIES_CACHE_TTL_SECONDS,
      operation: async () => {
        const [mongo, postgres, redis] = await Promise.all([this.checkMongo(), this.checkPostgres(), this.checkRedis()])
        return { checkedAt: new Date().toISOString(), dependencies: { mongo, postgres, redis } }
      }
    })
  }

  getMetrics(server: Server): Promise<MetricsOutput> {
    return this.cached({
      key: 'health:metrics',
      ttlSeconds: METRICS_CACHE_TTL_SECONDS,
      operation: () => this.collectMetrics(server)
    })
  }

  checkMongo(): Promise<DependencyCheck> {
    return this.runCheck('checkMongo', async () => {
      const db = this.connectedMongoDb()

      if (!db) return false

      await db.command({ ping: 1 }, { timeoutMS: CHECK_TIMEOUT_MS })
      return true
    })
  }

  checkPostgres(): Promise<DependencyCheck> {
    return this.runCheck('checkPostgres', async () => {
      const result = await this.postgres.query('SELECT 1')
      return result.length > 0
    })
  }

  checkRedis(): Promise<DependencyCheck> {
    return this.runCheck('checkRedis', async () => (await this.redis.ping()) === 'PONG')
  }

  getMemory(): MemoryOutput {
    const processMemory = process.memoryUsage()
    const heapStats = v8.getHeapStatistics()
    // 0 when there is no constraint; very large values also mean "unlimited".
    const constrained = process.constrainedMemory()
    const limit = constrained > 0 && constrained < Number.MAX_SAFE_INTEGER ? constrained : null

    return {
      process: {
        usedRam: toMb(processMemory.rss),
        heapTotal: toMb(processMemory.heapTotal),
        heapUsed: toMb(processMemory.heapUsed),
        external: toMb(processMemory.external),
        arrayBuffers: toMb(processMemory.arrayBuffers)
      },
      v8: {
        totalHeapSize: toMb(heapStats.total_heap_size),
        executableHeapSize: toMb(heapStats.total_heap_size_executable),
        heapSizeLimit: toMb(heapStats.heap_size_limit)
      },
      container: {
        limit: limit === null ? null : toMb(limit),
        rssPercent: limit === null ? null : round((processMemory.rss / limit) * 100)
      },
      heapSpaces: v8.getHeapSpaceStatistics().map<HeapSpaceOutput>((space) => ({
        name: space.space_name,
        size: toMb(space.space_size),
        used: toMb(space.space_used_size),
        available: toMb(space.space_available_size)
      }))
    }
  }

  // Resets the histogram, GC counters and CPU baseline together so they share the same window.
  getRuntimeWindow(): RuntimeWindowOutput {
    const now = performance.now()
    const elapsedMs = Math.max(1, now - this.windowStartedAt)
    const cpu = process.cpuUsage(this.cpuBaseline)

    // The histogram measures the time between ticks, sampling interval included: subtract it.
    const lagMs = (ns: number): number =>
      Number.isFinite(ns) ? round(Math.max(0, ns / 1_000_000 - EVENT_LOOP_RESOLUTION_MS)) : 0
    const hasSamples = this.eventLoopHistogram.count > 0

    const output: RuntimeWindowOutput = {
      seconds: round(elapsedMs / 1000),
      eventLoopLag: {
        meanMs: hasSamples ? lagMs(this.eventLoopHistogram.mean) : 0,
        maxMs: hasSamples ? lagMs(this.eventLoopHistogram.max) : 0,
        p99Ms: hasSamples ? lagMs(this.eventLoopHistogram.percentile(99)) : 0
      },
      gc: {
        ...this.gc,
        totalPauseMs: round(this.gc.totalPauseMs),
        maxPauseMs: round(this.gc.maxPauseMs)
      },
      processCpu: {
        usagePercent: round(((cpu.user + cpu.system) / 1000 / elapsedMs) * 100),
        userMs: round(cpu.user / 1000),
        systemMs: round(cpu.system / 1000)
      }
    }

    this.eventLoopHistogram.reset()
    this.gc = HealthService.emptyGc()
    this.windowStartedAt = now
    this.cpuBaseline = process.cpuUsage()
    return output
  }

  async getHostCpu(): Promise<HostCpuOutput> {
    const cpus = os.cpus().length
    const [lastMinute, lastFiveMinutes, lastFifteenMinutes] = os.loadavg()

    let cores: CpuCoreLoad[] = []
    try {
      const load = await systeminformation.currentLoad()
      cores = load.cpus.map((core, index) => ({
        core: index + 1,
        load: `${core.load.toFixed(2)}%` as PercentFormatted
      }))
    } catch (error) {
      this.logError(error, `${HealthService.name}.getHostCpu`)
    }

    return {
      cpus,
      globalAverage: {
        lastMinute: this.getLoadAverage(lastMinute, cpus),
        lastFiveMinutes: this.getLoadAverage(lastFiveMinutes, cpus),
        lastFifteenMinutes: this.getLoadAverage(lastFifteenMinutes, cpus)
      },
      cores
    }
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

  async getMongoServerStatus(): Promise<MongoServerStatusOutput> {
    const db = this.connectedMongoDb()

    if (!db) {
      return MONGO_STATUS_UNAVAILABLE
    }

    try {
      const status = await this.withTimeout(db.command({ serverStatus: 1 }), 'Mongo serverStatus')
      return this.toMongoServerStatus(status)
    } catch (error) {
      this.logError(error, `${HealthService.name}.getMongoServerStatus`)
      return MONGO_STATUS_UNAVAILABLE
    }
  }

  async getPostgresConnections(): Promise<PostgresConnectionOutput | null> {
    try {
      const [connections] = await this.withTimeout(
        this.postgres.query(`
          SELECT
            COUNT(*) FILTER (
              WHERE backend_type = 'client backend' AND datname = current_database()
            )::int AS current,
            COUNT(*) FILTER (
              WHERE backend_type = 'client backend' AND datname = current_database() AND state = 'active'
            )::int AS active,
            GREATEST(
              current_setting('max_connections')::int -
              current_setting('superuser_reserved_connections')::int -
              COUNT(*) FILTER (WHERE backend_type = 'client backend'),
              0
            )::int AS available
          FROM pg_stat_activity;
        `),
        'Postgres connections'
      )

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

  async getPostgresDatabaseSize(): Promise<string | null> {
    try {
      const [result] = await this.withTimeout(
        this.postgres.query(`SELECT pg_database_size(current_database())::text AS "databaseSizeBytes"`),
        'Postgres database size'
      )
      return String(result.databaseSizeBytes)
    } catch (error) {
      this.logError(error, `${HealthService.name}.getPostgresDatabaseSize`)
      return null
    }
  }

  async getRedisInfo(): Promise<RedisInfoOutput | null> {
    try {
      const raw = await this.withTimeout(this.redis.client.info(), 'Redis INFO')
      const info = new Map(
        raw
          .split(/\r?\n/)
          .filter((line) => line.includes(':') && !line.startsWith('#'))
          .map((line) => {
            const index = line.indexOf(':')
            return [line.slice(0, index), line.slice(index + 1)] as const
          })
      )
      const read = (key: string): number => Number(info.get(key) ?? 0)
      const maxMemory = read('maxmemory')

      return {
        usedMemory: toMb(read('used_memory')),
        maxMemory: maxMemory > 0 ? toMb(maxMemory) : null,
        connectedClients: read('connected_clients'),
        evictedKeys: read('evicted_keys')
      }
    } catch (error) {
      this.logError(error, `${HealthService.name}.getRedisInfo`)
      return null
    }
  }

  private connectedMongoDb(): mongo.Db | undefined {
    const connected = this.mongo.readyState === ConnectionStates.connected
    return connected ? this.mongo.db : undefined
  }

  private toMongoServerStatus(status: mongo.Document): MongoServerStatusOutput {
    return {
      connection: status.connections ?? null,
      memory: this.toMongoCacheMemory(status.wiredTiger?.cache)
    }
  }

  private toMongoCacheMemory(cache: mongo.Document | undefined): MongoCacheMemoryOutput {
    if (!cache) {
      this.warnMissingWiredTigerCache()
      return MONGO_STATUS_UNAVAILABLE.memory
    }

    return {
      used: toMbOrNull(cache['bytes currently in the cache']),
      limit: toMbOrNull(cache['maximum bytes configured'])
    }
  }

  // DocumentDB does not expose WiredTiger metrics, so a missing cache is expected there.
  private warnMissingWiredTigerCache(): void {
    if (this.secrets.IS_DOCUMENTDB) return

    this.logger.warn({
      message: 'WiredTiger cache not available - check MongoDB version/config',
      metadata: { context: HealthService.name }
    })
  }

  private getLoadAverage(load: number, cpus: number): Load {
    const thresholds: { limit: number; status: LoadStatus }[] = [
      { limit: 60, status: 'healthy 🟢' },
      { limit: 80, status: 'warning ⚠️' },
      { limit: Infinity, status: 'overloaded 🔴' }
    ]
    const percentage = (load / cpus) * 100
    const status = thresholds.find((t) => percentage < t.limit)?.status ?? 'overloaded 🔴'

    if (status !== 'healthy 🟢') {
      this.logger.warn({
        message: `Host CPU ${status} - Load: ${load.toFixed(2)}, CPUs: ${cpus}, Usage: ${percentage.toFixed(1)}%`,
        metadata: { context: HealthService.name }
      })
    }

    return { load, status }
  }

  private async runCheck(name: string, check: () => Promise<boolean>): Promise<DependencyCheck> {
    const startedAt = performance.now()
    const latencyMs = (): number => round(performance.now() - startedAt)
    try {
      const ok = await this.withTimeout(check(), name)
      return { status: ok ? HealthStatus.UP : HealthStatus.DOWN, latencyMs: latencyMs() }
    } catch (error) {
      this.logError(error, `${HealthService.name}.${name}`)
      return { status: HealthStatus.DOWN, latencyMs: latencyMs() }
    }
  }

  private async withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
    let timer: NodeJS.Timeout | undefined
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new ApiInternalServerException(`${label} timed out after ${CHECK_TIMEOUT_MS}ms`)),
        CHECK_TIMEOUT_MS
      )
    })
    try {
      return await Promise.race([promise, timeout])
    } finally {
      clearTimeout(timer)
    }
  }

  private async collectMetrics(server: Server): Promise<MetricsOutput> {
    const runtime = this.getRuntimeWindow()
    const memory = this.getMemory()

    const [cpu, connections, mongo, postgresConnection, databaseSizeBytes, redis] = await Promise.all([
      this.getHostCpu(),
      this.getHttpConnections(server),
      this.getMongoServerStatus(),
      this.getPostgresConnections(),
      this.getPostgresDatabaseSize(),
      this.getRedisInfo()
    ])

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

  // Cache hit: answer from memory. Miss: concurrent callers share one operation, then the result is stored.
  // Stored as JSON, so every caller gets its own copy and cannot mutate what others receive.
  private async cached<T>({ key, ttlSeconds, operation }: HealthCachedInput<T>): Promise<T> {
    const hit = await this.cache.get(key)

    if (hit) {
      return JSON.parse(hit) as T
    }

    return this.singleFlight.run({
      key,
      operation: async () => {
        const value = await operation()
        await this.cache.set(key, JSON.stringify(value), { ttlSeconds })
        return value
      }
    })
  }

  private logError(error: unknown, context: string): void {
    this.logger.error(
      new ApiInternalServerException('Health check failed', {
        context,
        cause: error
      })
    )
  }

  private static emptyGc(): GcOutput {
    return { count: 0, minor: 0, major: 0, totalPauseMs: 0, maxPauseMs: 0 }
  }
}

export type MongoServerStatusOutput = {
  connection: MongoConnectionOutput | null
  memory: MongoCacheMemoryOutput
}

export type RuntimeWindowOutput = {
  seconds: number
  eventLoopLag: EventLoopLagOutput
  gc: GcOutput
  processCpu: ProcessOutput['cpu']
}

type HealthCachedInput<T> = {
  key: string
  ttlSeconds: number
  operation: () => Promise<T>
}
