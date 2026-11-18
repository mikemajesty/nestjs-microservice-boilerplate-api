import "../../utils/model.tsp";
import "@typespec/http";

namespace api.Health;

@doc("result of a single dependency check")
model DependencyCheck {
  @doc("Dependency status: **UP** | **DOWN**")
  status: string;

  @doc("Time the check took in milliseconds; on failure, time until the error or the 2s timeout")
  latencyMs: decimal;
}

@doc("readiness probe output")
model ReadinessOutput {
  @doc("**UP** only when every dependency is UP; the endpoint answers 503 otherwise")
  status: string;

  @doc("application version")
  version: string;

  @doc("Timestamp of the check")
  timestamp: string;

  @doc("dependency checks")
  dependencies: {
    mongo: DependencyCheck;
    postgres: DependencyCheck;
    redis: DependencyCheck;
  };
}

@doc("metrics output; does not decide readiness")
model MetricsOutput {
  @doc("application version")
  version: string;

  @doc("Timestamp of the snapshot")
  timestamp: string;

  @doc("""
    Event loop, GC and process CPU are aggregated since the previous call to this endpoint, then reset.
    HTTP request rate and latency are exported via OpenTelemetry, not here.
  """)
  window: {
    @doc("Length of the window in seconds")
    seconds: decimal;
  };

  @doc("process information")
  process: ProcessOutput;

  @doc("memory usage")
  memory: MemoryOutput;

  @doc("event loop lag over the window")
  eventLoopLag: EventLoopLagOutput;

  @doc("garbage collection over the window")
  gc: GcOutput;

  @doc("network information")
  network: {
    @doc("Open TCP sockets on the HTTP server, keep-alive included; null when unavailable")
    connections: int32 | null;
  };

  @doc("host CPU; machine-wide values, all processes included")
  cpu: {
    @doc("number of logical CPUs")
    cpus: int16;

    @doc("cpu load average")
    globalAverage: {
      @doc("cpu load average on last minute")
      lastMinute: HealthOutputLoad;

      @doc("cpu load average on five minute")
      lastFiveMinutes: HealthOutputLoad;

      @doc("cpu load average on fifteen minute")
      lastFifteenMinutes: HealthOutputLoad;
    };

    @doc("cpu cores")
    cores: {
      @doc("cpu core number")
      core: int16;

      @doc("cpu core load")
      load: string;
    }[];
  };

  @doc("mongo metrics")
  mongo: {
    @doc("MongoDB serverStatus.connections (server-wide, all clients); null when unavailable")
    connection: MongoConnectionOutput | null;

    @doc("MongoDB WiredTiger cache metrics; values may be null when unsupported or unavailable")
    memory: MongoCacheMemoryOutput;
  };

  @doc("postgres metrics")
  postgres: {
    @doc("PostgreSQL connection metrics; null when unavailable")
    connection: PostgresConnectionOutput | null;

    @doc("Size of the application database (current_database()) in bytes; null when unavailable")
    databaseSizeBytes: string | null;
  };

  @doc("Redis INFO metrics; null when Redis is unreachable or INFO failed")
  redis: RedisInfoOutput | null;
}

@doc("process information")
model ProcessOutput {
  @doc("Machine or pod name; in Kubernetes it identifies which pod answered")
  hostname: string;

  @doc("Process id")
  pid: int32;

  @doc("Node.js version")
  nodeVersion: string;

  @doc("Application environment")
  environment: string;

  @doc("Process uptime in seconds")
  uptimeSeconds: int32;

  @doc("CPU used by this process only (process.cpuUsage())")
  cpu: {
    @doc("CPU time over wall time in the window; 100% = one full core, like `top`")
    usagePercent: decimal;

    @doc("User CPU time in the window, in milliseconds")
    userMs: decimal;

    @doc("System CPU time in the window, in milliseconds")
    systemMs: decimal;
  };
}

@doc("garbage collection metrics over the window")
model GcOutput {
  @doc("Garbage collections in the window")
  count: int32;

  @doc("Young-generation collections (Scavenge); frequent and cheap")
  minor: int32;

  @doc("Full collections (Mark-Compact); frequent major GCs indicate memory pressure")
  major: int32;

  @doc("Sum of GC pause durations in milliseconds")
  totalPauseMs: decimal;

  @doc("Longest single GC pause in milliseconds")
  maxPauseMs: decimal;
}

@doc("Redis INFO metrics")
model RedisInfoOutput {
  @doc("Memory used by Redis")
  usedMemory: string;

  @doc("Configured maxmemory; null when 0 (no limit)")
  maxMemory: string | null;

  @doc("Connected clients")
  connectedClients: int32;

  @doc("Keys evicted because maxmemory was reached, since the Redis server started")
  evictedKeys: int64;
}

@doc("load average")
model HealthOutputLoad {
  @doc("load average")
  load: decimal;

  @doc("load average status: **healthy** | **warning** | **overloaded**")
  status: string;
}

@doc("memory usage")
model MemoryOutput {
  @doc("process memory")
  process: {
    @doc("""
      RSS: physical memory resident for the process. Can be lower than heapTotal, because
      committed-but-untouched pages and (on macOS) compressed pages are not counted.
    """)
    usedRam: string;

    @doc("Heap memory committed by V8.")
    heapTotal: string;

    @doc("Heap memory currently used by V8.")
    heapUsed: string;

    @doc("Memory allocated outside the V8 heap (e.g., buffers, native bindings).")
    external: string;

    @doc("ArrayBuffer memory currently allocated, a subset of `external`.")
    arrayBuffers: string;
  };

  @doc("v8 memory")
  v8: {
    @doc("Total heap size managed by V8.")
    totalHeapSize: string;

    @doc("Heap size actually being used; redundant with process.heapUsed.")
    usedHeapSize: string;

    @doc("Heap size reserved for compiled JavaScript code.")
    executableHeapSize: string;

    @doc("Maximum heap size before memory allocation fails; compare against the container memory limit.")
    heapSizeLimit: string;
  };

  @doc("""
    Memory limit imposed by the OS (cgroup in containers), from process.constrainedMemory().
    When RSS reaches it, the kernel kills the process (OOMKilled) instead of V8 raising an error.
  """)
  container: {
    @doc("Memory limit; null when the process has no constraint (e.g. local machine)")
    limit: string | null;

    @doc("RSS as a percentage of the limit; null when there is no limit")
    rssPercent: decimal | null;
  };

  @doc("""
    Per-space heap breakdown from v8.getHeapSpaceStatistics(). A long-lived leak
    surfaces in `old_space`; large strings/arrays in `large_object_space`; a busy
    but flat `new_space` is allocation churn, not a leak.
  """)
  heapSpaces: HeapSpaceOutput[];
}

@doc("V8 heap space metrics")
model HeapSpaceOutput {
  @doc("V8 space name, e.g. new_space, old_space, large_object_space")
  name: string;

  @doc("Total size of the space")
  size: string;

  @doc("Used size of the space")
  used: string;

  @doc("Available size of the space")
  available: string;
}

@doc("event loop lag metrics")
model EventLoopLagOutput {
  @doc("Mean event loop delay in milliseconds over the window; the sampler resolution is already subtracted")
  meanMs: decimal;

  @doc("Maximum event loop delay in milliseconds over the window; the sampler resolution is already subtracted")
  maxMs: decimal;

  @doc("99th percentile event loop delay in milliseconds over the window; the sampler resolution is already subtracted")
  p99Ms: decimal;
}

@doc("MongoDB WiredTiger cache metrics; values may be null when unsupported or unavailable")
model MongoCacheMemoryOutput {
  @doc("Bytes currently in the cache")
  used: string | null;

  @doc("Maximum bytes configured for the cache")
  limit: string | null;
}

@doc("MongoDB serverStatus.connections; server-wide, all clients included")
model MongoConnectionOutput {
  @doc("Number of active connections currently in use")
  active: int64;

  @doc("Number of connection slots available for new clients")
  available: int64;

  @doc("Total number of current connections")
  current: int64;

  @doc("Total number of connections created since server start")
  totalCreated: int64;

  @doc("Connections rejected by the server; present on newer MongoDB versions")
  rejected?: int64;

  @doc("Connections queued for establishment")
  queuedForEstablishment?: int64;

  @doc("Connection establishment rate limit counters")
  establishmentRateLimit?: {
    rejected: int64;
    exempted: int64;
    interruptedDueToClientDisconnect: int64;
  };

  @doc("Number of threaded connections")
  threaded?: int64;

  @doc("Number of exhaust isMaster connections")
  exhaustIsMaster?: int64;

  @doc("Number of exhaust hello connections")
  exhaustHello?: int64;

  @doc("Number of connections awaiting topology changes")
  awaitingTopologyChanges?: int64;
}

@doc("PostgreSQL connection metrics")
model PostgresConnectionOutput {
  @doc("Client backends active on the application database")
  active: int64;

  @doc("Connection slots left on the server, all databases considered")
  available: int64;

  @doc("Client backends connected to the application database")
  current: int64;
}

@doc("Liveness probe response model")
model LivenessOutput {
  @doc("Application status: **UP** | **DOWN**")
  status: string;

  @doc("Timestamp of the health check")
  timestamp: string;

  @doc("Application uptime in seconds")
  uptime: decimal;
}

@doc("Root health response model")
model RootHealthOutput {
  @doc("Application status: **UP** | **DOWN**")
  status: string;

  @doc("Timestamp of the health check")
  timestamp: string;

  @doc("Application uptime in seconds")
  uptime: decimal;
}

@doc("Startup probe response model")
model StartupOutput {
  @doc("Application startup status: **UP** | **DOWN**")
  status: string;

  @doc("Timestamp of the health check")
  timestamp: string;

  @doc("Health check phase identifier")
  phase: string;

  @doc("""
    Basic connection status for each service.
    Omitted when startup fails before connections are checked.
  """)
  connections?: {
    @doc("MongoDB connection status: **connected** | **disconnected**")
    mongo: string;

    @doc("PostgreSQL connection status: **connected** | **disconnected**")
    postgres: string;

    @doc("Redis connection status: **connected** | **disconnected**")
    redis: string;
  };

  @doc("Human-readable status message")
  message: string;

  @doc("Optional error message if startup fails")
  error?: string;
}