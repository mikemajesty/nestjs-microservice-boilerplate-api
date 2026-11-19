export enum HealthStatus {
  UP = `UP 🟢`,
  DOWN = `DOWN 🔴`
}

export type ByteSizeFormatted = `${number} MB`

export type PercentFormatted = `${number}%`

export type LoadStatus = 'healthy 🟢' | 'warning ⚠️' | 'overloaded 🔴'

export type DependencyCheck = {
  status: HealthStatus
  latencyMs: number
}

export type DependenciesOutput = {
  mongo: DependencyCheck
  postgres: DependencyCheck
  redis: DependencyCheck
}

/** Dependency checks plus when they ran; cached, so `checkedAt` can be older than the request. */
export type DependenciesSnapshot = {
  checkedAt: string
  dependencies: DependenciesOutput
}

export type ReadinessOutput = {
  status: HealthStatus
  version: string
  /** When this response was built. */
  timestamp: string
  /** When the dependency checks ran (cached for a short TTL). */
  checkedAt: string
  dependencies: DependenciesOutput
}

export type MemoryOutput = {
  process: {
    usedRam: ByteSizeFormatted
    heapTotal: ByteSizeFormatted
    heapUsed: ByteSizeFormatted
    external: ByteSizeFormatted
    arrayBuffers: ByteSizeFormatted
  }
  v8: {
    totalHeapSize: ByteSizeFormatted
    executableHeapSize: ByteSizeFormatted
    heapSizeLimit: ByteSizeFormatted
  }
  container: {
    limit: ByteSizeFormatted | null
    rssPercent: number | null
  }
  heapSpaces: HeapSpaceOutput[]
}

export type HeapSpaceOutput = {
  name: string
  size: ByteSizeFormatted
  used: ByteSizeFormatted
  available: ByteSizeFormatted
}

export type EventLoopLagOutput = {
  meanMs: number
  maxMs: number
  p99Ms: number
}

export type GcOutput = {
  count: number
  minor: number
  major: number
  totalPauseMs: number
  maxPauseMs: number
}

export type ProcessOutput = {
  hostname: string
  pid: number
  nodeVersion: string
  environment: string
  uptimeSeconds: number
  cpu: {
    /** 100% = one full core (like `top`), not the whole machine. */
    usagePercent: number
    userMs: number
    systemMs: number
  }
}

export type Load = {
  load: number
  status: LoadStatus
}

export type CpuCoreLoad = {
  core: number
  load: PercentFormatted
}

export type HostCpuOutput = {
  cpus: number
  globalAverage: {
    lastMinute: Load
    lastFiveMinutes: Load
    lastFifteenMinutes: Load
  }
  cores: CpuCoreLoad[]
}

/** Server-wide (serverStatus.connections): counts every client, not only this app. */
export type MongoConnectionOutput = {
  active: number
  available: number
  current: number
  totalCreated: number
  rejected?: number
  queuedForEstablishment?: number
  establishmentRateLimit?: {
    rejected: number
    exempted: number
    interruptedDueToClientDisconnect: number
  }
  threaded?: number
  exhaustIsMaster?: number
  exhaustHello?: number
  awaitingTopologyChanges?: number
}

/** `current` and `active` count the application database only; `available` is server-wide. */
export type PostgresConnectionOutput = {
  active: number
  available: number
  current: number
}

export type MongoCacheMemoryOutput = {
  used: ByteSizeFormatted | null
  limit: ByteSizeFormatted | null
}

export type RedisInfoOutput = {
  usedMemory: ByteSizeFormatted
  maxMemory: ByteSizeFormatted | null
  connectedClients: number
  evictedKeys: number
}

export type LivenessOutput = {
  status: HealthStatus
  timestamp: string
  uptime: number
}

export type RootHealthOutput = LivenessOutput

export type ConnectionState = 'connected' | 'disconnected'

export type StartupOutput = {
  status: HealthStatus
  timestamp: string
  checkedAt: string
  phase: string
  connections: {
    mongo: ConnectionState
    postgres: ConnectionState
    redis: ConnectionState
  }
  message: string
}

export type MetricsOutput = {
  version: string
  timestamp: string
  /** Event loop, GC and process CPU cover the time since the previous call; reading resets them. */
  window: {
    seconds: number
  }
  process: ProcessOutput
  memory: MemoryOutput
  eventLoopLag: EventLoopLagOutput
  gc: GcOutput
  network: {
    connections: number | null
  }
  cpu: HostCpuOutput
  mongo: {
    connection: MongoConnectionOutput | null
    memory: MongoCacheMemoryOutput
  }
  postgres: {
    connection: PostgresConnectionOutput | null
    databaseSizeBytes: string | null
  }
  redis: RedisInfoOutput | null
}
