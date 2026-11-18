// ---------------------------------------------------------------------------
// Base semantic types
// ---------------------------------------------------------------------------

export enum HealthStatus {
  UP = `UP 🟢`,
  DOWN = `DOWN 🔴`
}

/** Value already formatted for display, e.g. "123.45 MB". Do not use for aggregation. */
export type ByteSizeFormatted = `${number} MB`

/** Value already formatted for display, e.g. "42.3%". Do not use for aggregation. */
export type PercentFormatted = `${number}%`

/** Formatted latency, e.g. "18ms Excellent" or "N/A". */
export type LatencyFormatted = string

/** CPU load classification derived from getLoadAvarage(). */
export type LoadStatus = 'healthy 🟢' | 'warning ⚠️' | 'overloaded 🔴'

// ---------------------------------------------------------------------------
// Memory
// ---------------------------------------------------------------------------

export type MemoryOutput = {
  /** process.memoryUsage() — Node process memory. */
  process: {
    /** rss — total process memory, heap included. If it grows while heapUsed is flat, look outside the JS heap. */
    usedRam: ByteSizeFormatted
    /** heapTotal — memory reserved by V8 for the heap. */
    heapTotal: ByteSizeFormatted
    /** heapUsed — memory held by live JS objects. Leaks in application code surface here. */
    heapUsed: ByteSizeFormatted
    /** external — native memory outside the JS heap (Buffers, etc.). */
    external: ByteSizeFormatted
    /** arrayBuffers — subset of `external`, ArrayBuffers currently allocated. */
    arrayBuffers: ByteSizeFormatted
  }
  /** v8.getHeapStatistics() — V8's view of the heap. */
  v8: {
    totalHeapSize: ByteSizeFormatted
    /** Redundant with process.heapUsed; kept for compatibility. */
    usedHeapSize: ByteSizeFormatted
    executableHeapSize: ByteSizeFormatted
    /** Effective V8 ceiling. Compare against the container memory limit. */
    heapSizeLimit: ByteSizeFormatted
  }
  /**
   * v8.getHeapSpaceStatistics() — per-space heap breakdown.
   * old_space growing = long-lived leak.
   * new_space busy but flat = allocation churn.
   * large_object_space = large strings/arrays.
   */
  heapSpaces: HeapSpaceOutput[]
}

export type HeapSpaceOutput = {
  /** V8 space name, e.g. new_space, old_space, large_object_space. */
  name: string
  size: ByteSizeFormatted
  used: ByteSizeFormatted
  available: ByteSizeFormatted
}

// ---------------------------------------------------------------------------
// Event loop
// ---------------------------------------------------------------------------

export type EventLoopLagOutput = {
  /** Mean event loop delay in milliseconds over the sampling window. */
  meanMs: number
  /** Maximum event loop delay in milliseconds over the sampling window. */
  maxMs: number
  /** 99th percentile event loop delay in milliseconds over the sampling window. */
  p99Ms: number
}

// ---------------------------------------------------------------------------
// Connections
// ---------------------------------------------------------------------------

export type MongoConnectionOutput = {
  active: number
  available: number
  current: number
  totalCreated: number
  /** Present on newer MongoDB versions. */
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

export type PostgresConnectionOutput = {
  active: number
  available: number
  current: number
}

/** MongoDB WiredTiger cache metrics — native memory outside the V8 heap. */
export type MongoCacheMemoryOutput = {
  used: ByteSizeFormatted | null
  limit: ByteSizeFormatted | null
}

/** @deprecated use MongoCacheMemoryOutput — the previous name was ambiguous. */
export type CacheMemoryOutput = MongoCacheMemoryOutput

// ---------------------------------------------------------------------------
// CPU / load
// ---------------------------------------------------------------------------

export type Load = {
  load: number
  status: LoadStatus
}

export type CpuCoreLoad = {
  core: number
  load: PercentFormatted
}

// ---------------------------------------------------------------------------
// Probe outputs
// ---------------------------------------------------------------------------

export type LivenessOutput = {
  status: HealthStatus
  timestamp: string
  uptime: number
}

export type RootHealthOutput = LivenessOutput

export type StartupOutput = {
  status: HealthStatus
  timestamp: string
  phase: string
  /**
   * Basic connection status for each service.
   * Omitted when startup fails before connection states are determined.
   */
  connections?: {
    mongo: string
    postgres: string
    redis: string
  }
  message: string
  /** Present only when the startup check throws unexpectedly. */
  error?: string
}

// ---------------------------------------------------------------------------
// Aggregated health output
// ---------------------------------------------------------------------------

export type HealthOutput = {
  server: HealthStatus
  version: string
  mongo: {
    status: HealthStatus
    /**
     * null when the connection is not ready (status DOWN) or the read failed.
     * May be null even with status UP if serverStatus did not return connections.
     */
    connection: MongoConnectionOutput | null
    memory: MongoCacheMemoryOutput
  }
  postgres: {
    status: HealthStatus
    /** null when the query failed, regardless of status. */
    connection: PostgresConnectionOutput | null
    databaseSizeBytes: string | null
  }
  redisState: HealthStatus
  network: {
    latency: LatencyFormatted
    /** Number of HTTP requests in flight at the moment of the snapshot. */
    connections: number | null
  }
  memory: MemoryOutput
  cpu: {
    cpus: number
    globalAverage: {
      lastMinute: Load
      lastFiveMinutes: Load
      lastFifteenMinutes: Load
    }
    cores: CpuCoreLoad[]
  }
  /** Omitted when the runtime does not expose event loop metrics. */
  eventLoopLag?: EventLoopLagOutput
}
