export enum HealthStatus {
  UP = `UP 🟢`,
  DOWN = `DOWN 🔴`
}

export type MemoryOutput = {
  process: {
    usedRam: string
    heapTotal: string
    heapUsed: string
    external: string
  }
  v8: {
    totalHeapSize: string
    usedHeapSize: string
    executableHeapSize: string
    heapSizeLimit: string
  }
}

export type HealthOutput = {
  server: string
  version: string
  mongo: {
    status: string
    connection: MongoConnectionOutput | null
    memory: CacheMemoryOutput
  }
  postgres: {
    status: string
    connection: PostgresConnectionOutput | null
    databaseSizeBytes: string | null
  }
  redisState: string
  network: {
    latency: string
    connections: number | null
  }
  memory: MemoryOutput
  cpu: {
    cpus: number
    globalAvarage: {
      lastMinute: Load
      lastFiveMinutes: Load
      lastFifteenMinutes: Load
    }
    cores: { core: number; load: string }[]
  }
}

export type Load = {
  load: number
  status: string
}

export type MongoConnectionOutput = {
  active: number
  available: number
  current: number
  totalCreated: number
}

export type PostgresConnectionOutput = {
  active: number
  available: number
  current: number
}

export type CacheMemoryOutput = {
  used: string | null
  limit: string | null
}
