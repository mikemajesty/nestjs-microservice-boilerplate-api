import "../../utils/model.tsp";
import "@typespec/http";

namespace api.Health;

@doc("health output")
model HealthOutput {
  @doc("application status: **UP** | **DOWN** ")
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
    memory: {
      used: string | null;
      limit: string | null;
    };
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

  @doc("redis status: **UP** | **DOWN** ")
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
  memory: {
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
    };

    @doc("v8 memory")
    v8: {
      @doc("Total heap size managed by V8.")
      totalHeapSize: string;

      @doc("Heap size actually being used.")
      usedHeapSize: string;

      @doc("Heap size reserved for compiled JavaScript code.")
      executableHeapSize: string;

      @doc("Maximum heap size before memory allocation fails.")
      heapSizeLimit: string;
    };
  };

  @doc("cpu usage")
  cpu: {
    @doc("max healthy limit/total cpus")
    cpus: int16;

    @doc("cpu load average")
    globalAvarage: {
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
}

@doc("load avererage")
model HealthOutputLoad {
  @doc("load avererage")
  load: decimal;

  @doc("load avererage status **healthy** | **overloaded**")
  status: string;
}

@doc("MongoDB connection pool metrics")
model MongoConnectionOutput {
  active: int64;
  available: int64;
  current: int64;
  totalCreated: int64;

  @doc("Additional metrics reported by MongoDB versions that expose them")
  rejected?: int64;
  queuedForEstablishment?: int64;
  establishmentRateLimit?: {
    rejected: int64;
    exempted: int64;
    interruptedDueToClientDisconnect: int64;
  };
  threaded?: int64;
  exhaustIsMaster?: int64;
  exhaustHello?: int64;
  awaitingTopologyChanges?: int64;
}

@doc("PostgreSQL connection metrics")
model PostgresConnectionOutput {
  active: int64;
  available: int64;
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

@doc("Startup probe response model")
model StartupOutput {
  @doc("Application startup status: **UP** | **DOWN**")
  status: string;

  @doc("Timestamp of the health check")
  timestamp: string;

  @doc("Health check phase identifier")
  phase: string;

  @doc("Basic connection status for each service")
  connections: {
    @doc("MongoDB connection status")
    mongo: string;

    @doc("PostgreSQL initialization status")
    postgres: string;

    @doc("Redis client ready status")
    redis: string;
  };

  @doc("Human-readable status message")
  message: string;

  @doc("Optional error message if startup fails")
  error?: string;
}
