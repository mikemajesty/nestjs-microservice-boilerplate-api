import "../../utils/model.tsp";
import "@typespec/http";

using TypeSpec.Http;
using api.Utils.Model;

namespace api.Health;

@doc("health output")
model HealthOuput {
  @doc("application status: **UP** | **DOWN** ")
  server: string;

  @doc("application version")
  version: string;

  @doc("mongo status: **UP** | **DOWN** ")
  mongoState: string;

  @doc("redis status: **UP** | **DOWN** ")
  redisState: string;

  @doc("postgres status: **UP** | **DOWN** ")
  postgresState: string;

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
    connections: int32;
  };

  @doc("memory usage")
  memory: {
    @doc("process memory")
    process: {
      @doc("Total memory allocated by the process, including heap, buffers, and native code.")
      ramUsed: string;

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
    @doc("max healthy limit")
    healthyLimit: int16;

    @doc("cpu load average")
    loadAverage: {
      @doc("cpu load average on last minute")
      lastMinute: HealthOuputLoad;

      @doc("cpu load average on five minute")
      lastFiveMinutes: HealthOuputLoad;

      @doc("cpu load average on fifteen minute")
      lastFifteenMinutes: HealthOuputLoad;
    };
  };
}

@doc("load avererage")
model HealthOuputLoad {
  @doc("load avererage")
  load: decimal;

  @doc("load avererage status **healthy** | **overloaded**")
  status: string;
}
