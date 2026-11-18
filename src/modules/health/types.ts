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

/** CPU load classification derived from getLoadAverage(). */
export type LoadStatus = 'healthy 🟢' | 'warning ⚠️' | 'overloaded 🔴'

// ---------------------------------------------------------------------------
// Readiness: dependency checks only. Kept cheap because orchestrators call it often.
// ---------------------------------------------------------------------------

export type DependencyCheck = {
  status: HealthStatus
  /** Time the check took, in milliseconds. On failure, time until the error or timeout. */
  latencyMs: number
}

export type ReadinessOutput = {
  /** UP only when every dependency is UP. The endpoint answers 503 otherwise. */
  status: HealthStatus
  version: string
  timestamp: string
  dependencies: {
    mongo: DependencyCheck
    postgres: DependencyCheck
    redis: DependencyCheck
  }
}

// ---------------------------------------------------------------------------
// Memory
// ---------------------------------------------------------------------------

export type MemoryOutput = {
  /** process.memoryUsage() — Node process memory. */
  process: {
    /**
     * rss — physical memory resident for the process. Can be lower than heapTotal:
     * committed-but-untouched pages and (on macOS) compressed pages are not counted.
     */
    usedRam: ByteSizeFormatted
    /** heapTotal — memory committed by V8 for the heap. */
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
    /** Effective V8 ceiling. Compare against `container.limit`. */
    heapSizeLimit: ByteSizeFormatted
  }
  /**
   * process.constrainedMemory() — memory limit imposed by the OS (cgroup in containers).
   * When RSS reaches it, the kernel kills the process (OOMKilled) instead of V8 raising an error.
   */
  container: {
    /** null when the process has no memory constraint (e.g. local machine). */
    limit: ByteSizeFormatted | null
    /** RSS as a percentage of `limit`; null when there is no limit. */
    rssPercent: number | null
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
// Runtime (values cover the sampling window, see MetricsOutput.window)
// ---------------------------------------------------------------------------

export type EventLoopLagOutput = {
  /** Mean event loop delay in milliseconds. The sampler resolution is already subtracted. */
  meanMs: number
  /** Maximum event loop delay in milliseconds. The sampler resolution is already subtracted. */
  maxMs: number
  /** 99th percentile event loop delay in milliseconds. The sampler resolution is already subtracted. */
  p99Ms: number
}

export type GcOutput = {
  /** Garbage collections in the window. */
  count: number
  /** Young-generation collections (Scavenge). Frequent and cheap. */
  minor: number
  /** Full collections (Mark-Compact). Slower; frequent major GCs indicate memory pressure. */
  major: number
  /** Sum of GC pause durations in milliseconds. */
  totalPauseMs: number
  /** Longest single GC pause in milliseconds. */
  maxPauseMs: number
}

export type ProcessOutput = {
  /** Machine or pod name. In Kubernetes, this identifies which pod answered. */
  hostname: string
  pid: number
  nodeVersion: string
  environment: string
  uptimeSeconds: number
  /** process.cpuUsage() — CPU used by this process only. */
  cpu: {
    /** CPU time over wall time in the window. 100% = one full core, like `top`. */
    usagePercent: number
    userMs: number
    systemMs: number
  }
}

// ---------------------------------------------------------------------------
// Host CPU (machine-wide, all processes)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Dependencies
// ---------------------------------------------------------------------------

/** MongoDB serverStatus.connections — server-wide, all clients included. */
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
  /** Client backends active on the application database (includes this query). */
  active: number
  /** Connection slots left on the server, all databases considered. */
  available: number
  /** Client backends connected to the application database. */
  current: number
}

/** MongoDB WiredTiger cache metrics — native memory outside the V8 heap. */
export type MongoCacheMemoryOutput = {
  used: ByteSizeFormatted | null
  limit: ByteSizeFormatted | null
}

/** @deprecated use MongoCacheMemoryOutput — the previous name was ambiguous. */
export type CacheMemoryOutput = MongoCacheMemoryOutput

/** Redis INFO metrics. */
export type RedisInfoOutput = {
  usedMemory: ByteSizeFormatted
  /** null when maxmemory is 0 (no limit). */
  maxMemory: ByteSizeFormatted | null
  connectedClients: number
  /** Keys removed because maxmemory was reached, since the Redis server started. */
  evictedKeys: number
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
// Metrics: everything that does not decide readiness. For dashboards and humans.
// ---------------------------------------------------------------------------

export type MetricsOutput = {
  version: string
  timestamp: string
  /**
   * Event loop, GC and process CPU are aggregated since the previous call
   * to this endpoint, then reset. `seconds` is the length of that window.
   * HTTP request rate and latency are exported via OpenTelemetry (see main.ts), not here.
   */
  window: {
    seconds: number
  }
  process: ProcessOutput
  memory: MemoryOutput
  eventLoopLag: EventLoopLagOutput
  gc: GcOutput
  network: {
    /** Open TCP sockets on the HTTP server, keep-alive included; null when unavailable. */
    connections: number | null
  }
  cpu: HostCpuOutput
  mongo: {
    /** null when the connection is not ready or serverStatus failed. */
    connection: MongoConnectionOutput | null
    memory: MongoCacheMemoryOutput
  }
  postgres: {
    /** null when the query failed. */
    connection: PostgresConnectionOutput | null
    /** Size of the application database (current_database()) in bytes; null when unavailable. */
    databaseSizeBytes: string | null
  }
  /** null when Redis is unreachable or INFO failed. */
  redis: RedisInfoOutput | null
}
