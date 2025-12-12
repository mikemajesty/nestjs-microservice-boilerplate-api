export enum HealthStatus {
  UP = `UP 🟢`,
  DOWN = `DOWN 🔴`
}

export type MemotyOutput = {
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
    connection: DatabaseConnectionOutput
    memory: DatabaseMemoryOutput
  }
  postgres: {
    status: string
    connection: DatabaseConnectionOutput
    memory: DatabaseMemoryOutput
  }
  redisState: string
  network: {
    latency: string
    connections: number
  }
  memory: MemotyOutput
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

export type DatabaseConnectionOutput = {
  active: number
  available: number
  current: number
  totalCreated: number
}

export type DatabaseMemoryOutput = {
  ramUsed: number | string
  reservedMemory: number | string
}
