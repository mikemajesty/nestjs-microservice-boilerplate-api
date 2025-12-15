import { exec } from 'child_process'
import { Connection } from 'mongoose'
import ping from 'ping'
import { RedisClientType } from 'redis'
import systeminformation from 'systeminformation'
import { DataSource } from 'typeorm'
import v8 from 'v8'

import { ICacheAdapter } from '@/infra/cache'
import { ErrorType, ILoggerAdapter } from '@/infra/logger'

import { ApiInternalServerException } from './../../utils/exception'
import { IHealthAdapter } from './adapter'
import { DatabaseConnectionOutput, DatabaseMemoryOutput, HealthStatus, Load } from './types'

export class HealthService implements IHealthAdapter {
  postgres!: DataSource
  mongo!: Connection
  redis!: ICacheAdapter<RedisClientType>

  constructor(private readonly logger: ILoggerAdapter) {}

  async getPostgresMemory(): Promise<DatabaseMemoryOutput> {
    try {
      const result = await this.postgres.query(`
        SELECT 
          sum(pg_database_size(datname)) AS "ramUsed",
          sum(pg_stat_get_db_blocks_fetched(d.oid) * 8192) AS "reservedMemory"
        FROM pg_database d;
      `)

      return {
        ramUsed: `${(result[0].ramUsed / 1024 / 1024).toFixed(2)} MB`,
        reservedMemory: `${(result[0].reservedMemory / 1024 / 1024).toFixed(2)} MB`
      }
    } catch (error) {
      error = this.buildError(error, `${HealthService.name}/getPostgresMemory`)
      this.logger.error(error as ErrorType)
      return { ramUsed: 0, reservedMemory: 0 }
    }
  }

  async getMongoMemory(): Promise<DatabaseMemoryOutput> {
    try {
      if (this.mongo.readyState !== 1 || !this.mongo.db) {
        return { ramUsed: 'N/A', reservedMemory: 'N/A' }
      }

      const status = await this.mongo.db.command({ serverStatus: 1 })

      const cache = status.wiredTiger?.cache
      if (!cache) {
        throw new Error('WiredTiger cache not available - check MongoDB version/config')
      }

      const memory = {
        used: cache['bytes currently in the cache'] || 0,
        max: cache['maximum bytes configured'] || 0
      }

      return {
        ramUsed: `${(memory.used / 1024 / 1024).toFixed(2)} MB`,
        reservedMemory: `${(memory.max / 1024 / 1024).toFixed(2)} MB`
      }
    } catch (error) {
      error = this.buildError(error, `${HealthService.name}/getMongoMemory`)
      this.logger.error(error as ErrorType)
      return { ramUsed: 0, reservedMemory: 0 }
    }
  }
  async getMongoConnections(): Promise<DatabaseConnectionOutput> {
    try {
      if (this.mongo.readyState !== 1) {
        throw new ApiInternalServerException('mongo down')
      }

      if (this.mongo.db) {
        const status = await this.mongo.db.command({ serverStatus: 1 })

        return status.connections
      }
      return { active: 0, available: 0, current: 0, totalCreated: 0 }
    } catch (error) {
      error = this.buildError(error, `${HealthService.name}/getMongoConnections`)
      this.logger.error(error as ErrorType)
      return { active: 0, available: 0, current: 0, totalCreated: 0 }
    }
  }

  async getPostgresConnections(): Promise<DatabaseConnectionOutput> {
    try {
      const manager = this.postgres.manager
      const currentQuery = `SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active'`

      const availableQuery = `SHOW max_connections`

      const totalCreatedQuery = `SELECT COUNT(*) FROM pg_stat_activity`

      const current = await manager.query(currentQuery)
      const available = await manager.query(availableQuery)
      const totalCreated = await manager.query(totalCreatedQuery)

      return {
        current: Number(current[0].count),
        available: Number(available[0].max_connections) - Number(current[0].count),
        totalCreated: Number(totalCreated[0].count),
        active: Number(current[0].count)
      }
    } catch (error) {
      error = this.buildError(error, `${HealthService.name}/getPostgresConnections`)
      this.logger.error(error as ErrorType)
      return {
        current: 0,
        available: 0,
        totalCreated: 0,
        active: 0
      }
    }
  }

  getMemoryUsageInMB() {
    const processMemory = process.memoryUsage()
    const heapStats = v8.getHeapStatistics()
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
        context: HealthService.name
      })
    }

    return { load: time, status }
  }

  getActiveConnections() {
    return new Promise((resolve, reject) => {
      /* eslint-disable security/detect-child-process */
      exec(`lsof -i -n -p ${process.pid} | grep ESTABLISHED | wc -l`, (error, stdout, stderr) => {
        if (error) {
          reject(`Error getting connection: ${stderr}`)
        }
        resolve(parseInt(stdout.trim(), 10))
      })
    })
  }

  async getLatency(host = '8.8.8.8') {
    try {
      const res = await ping.promise.probe(host, { timeout: 200 })
      if (!res.time) {
        return '0ms'
      }
      const latency = [
        { latency: 20, status: 'Excellent' },
        { latency: 100, status: 'Acceptable' },
        { latency: 300, status: 'Poor' }
      ].find((l) => Number(res.time) < l.latency)
      return `${res.time}ms ${latency?.status ?? 'Critical'}`
    } catch (error) {
      error = this.buildError(error, `${HealthService.name}/getLatency`)
      this.logger.error(error as ErrorType)
      return 'Critical'
    }
  }

  async getCPUCore() {
    try {
      return await systeminformation.currentLoad()
    } catch (error) {
      error = this.buildError(error, `${HealthService.name}/getCPUCore`)
      this.logger.error(error as ErrorType)
      return { cpus: [] }
    }
  }

  async getPostgresStatus() {
    try {
      const result = await this.postgres.query('SELECT 1')

      return result ? HealthStatus.UP : HealthStatus.DOWN
    } catch (error) {
      error = this.buildError(error, `${HealthService.name}/postgres`)
      this.logger.error(error as ErrorType)
      return HealthStatus.DOWN
    }
  }

  getMongoStatus() {
    try {
      return this.mongo.readyState === 1 ? HealthStatus.UP : HealthStatus.DOWN
    } catch (error) {
      error = this.buildError(error, `${HealthService.name}/mongo`)
      this.logger.error(error as ErrorType)
      return HealthStatus.DOWN
    }
  }

  async getRedisStatus() {
    try {
      const status = await this.redis.ping()
      return status === 'PONG' ? HealthStatus.UP : HealthStatus.DOWN
    } catch (error) {
      error = this.buildError(error, `${HealthService.name}/redis`)
      this.logger.error(error as ErrorType)
      return HealthStatus.DOWN
    }
  }

  private buildError(error: unknown, context: string) {
    if (typeof error === 'string') {
      error = new ApiInternalServerException(error)
    }
    Object.assign(error as object, { context })
    return error
  }

  private bytesToMB = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2)
  }
}
