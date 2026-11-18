import "../../utils/model.tsp";
import "@typespec/http";

namespace api.Health;

@doc("health output")
model HealthOutput {
  @doc("application status: **UP** | **DOWN**")
  server: string;

  @doc("application version")
  version: string;

  @doc("mongo information")
  mongo: {
    @doc("MongoDB status: **UP** | **DOWN**")
    status: string;

    @doc("MongoDB connection pool metrics; null when unavailable")
    connection: MongoConnectionOutput | null;

    @doc("MongoDB WiredTiger cache metrics; values may be null when unsupported or unavailable")
    memory: MongoCacheMemoryOutput;
  };

  @doc("postgres information")
  postgres: {
    @doc("PostgreSQL status: **UP** | **DOWN**")
    status: string;

    @doc("PostgreSQL connection metrics; null when unavailable")
    connection: PostgresConnectionOutput | null;

    @doc("Total PostgreSQL database size in bytes; null when unavailable")
    databaseSizeBytes: string | null;
  };

  @doc("redis status: **UP** | **DOWN**")
  redisState: string;

  @doc("network information")
  network: {
    @doc("""
      -- representing the network latency --
      latency: ** <20  ** status: ** Excellent **\n
      latency: ** <100 ** status: ** Acceptable **\n
      latency: ** <300 ** status: ** Poor **\n
      latency: ** >300 ** status: ** Critical **
    """)
    latency: string;

    @doc("representing the active connections count")
    connections: int32 | null;
  };

  @doc("memory usage")
  memory: MemoryOutput;

  @doc("cpu usage")
  cpu: {
    @doc("max healthy limit/total cpus")
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

  @doc("event loop lag metrics; omitted when the runtime does not expose them")
  eventLoopLag?: EventLoopLagOutput;
}

@doc("load average")
model HealthOutputLoad {
  @doc("load average")
  load: decimal;

  @doc("load average status: **healthy** | **overloaded**")
  status: string;
}

@doc("memory usage")
model MemoryOutput {
  @doc("process memory")
  process: {
    @doc("Total memory allocated by the process, including heap, buffers, and native code.")
    usedRam: string;

    @doc("Total heap memory allocated by V8.")
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
  @doc("Mean event loop delay in milliseconds over the sampling window")
  meanMs: decimal;

  @doc("Maximum event loop delay in milliseconds over the sampling window")
  maxMs: decimal;

  @doc("99th percentile event loop delay in milliseconds over the sampling window")
  p99Ms: decimal;
}

@doc("MongoDB WiredTiger cache metrics; values may be null when unsupported or unavailable")
model MongoCacheMemoryOutput {
  @doc("Bytes currently in the cache")
  used: string | null;

  @doc("Maximum bytes configured for the cache")
  limit: string | null;
}

@doc("MongoDB connection pool metrics")
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
  @doc("Number of active client backends")
  active: int64;

  @doc("Number of connection slots available for new clients")
  available: int64;

  @doc("Total number of client backends")
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