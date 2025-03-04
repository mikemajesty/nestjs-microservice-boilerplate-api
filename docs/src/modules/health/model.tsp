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

  @doc("mongo information")
  mongo: DatabaseStatus;

  @doc("postgres information")
  postgres: DatabaseStatus;

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
    connections: int32;
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
      lastMinute: HealthOuputLoad;

      @doc("cpu load average on five minute")
      lastFiveMinutes: HealthOuputLoad;

      @doc("cpu load average on fifteen minute")
      lastFifteenMinutes: HealthOuputLoad;
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
model HealthOuputLoad {
  @doc("load avererage")
  load: decimal;

  @doc("load avererage status **healthy** | **overloaded**")
  status: string;
}

@doc("db information")
model DatabaseStatus {
  @doc("db status: **UP** | **DOWN** ")
  status: string;

  @doc("The set of numbers you provided represents connection metrics for the db server.")
  connection: {
    @doc("Refers to the number of active connections that are currently in use, typically handling ongoing operations or queries.")
    active: int64;

    @doc("Indicates the number of available connections that can be established with the db server, based on its configuration and resources.")
    available: int64;

    @doc("Represents the current number of active connections to the db server")
    current: int64;

    @doc("The total number of connections created since the server started.")
    totalCreated: int64;
  };

  @doc("Memory usage statistics for the database instance.")
  memory: {
    @doc("The amount of RAM currently used by database in megabytes (MB).")
    ramUsed: string;

    @doc("The total amount of virtual memory reserved by database in megabytes (MB).")
    reservedMemory: string;
  };
}
