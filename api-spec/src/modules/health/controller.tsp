import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi3";
import "@typespec/versioning";
import "../../utils/model.tsp";
import "./model.tsp";

using TypeSpec.Http;

@service(#{ title: "Health" })
namespace api.Health;

@tag("Health")
@route("/health")
interface HealthController {
  @get
  @route("/ready")
  @doc("""
    Readiness probe - checks if the application can handle requests.
    Only pings MongoDB, PostgreSQL and Redis (2s timeout each), so it stays cheap for orchestrators.
    Answers **503** when any dependency is DOWN.
  """)
  @returnsDoc("Overall status and the result of each dependency check")
  readiness(): ReadinessOutput | {
    @statusCode statusCode: 503;
    @body body: ReadinessOutput;
  };

  @get
  @route("/metrics")
  @doc("""
    Process, runtime and dependency metrics for dashboards and troubleshooting.
    Does not decide readiness. Event loop, GC and process CPU cover the window since the previous call, then reset.
  """)
  @returnsDoc("Metrics snapshot")
  metrics(): MetricsOutput;

  @get
  @route("/dashboard")
  @doc("HTML dashboard that polls /health/live, /health/startup, /health/ready and /health/metrics")
  @returnsDoc("HTML page")
  dashboard(): {
    @header contentType: "text/html";
    @body body: string;
  };

  @get
  @route("/live")
  @doc("Liveness probe - checks if application process is alive")
  @returnsDoc("Simple status indicating if the application process is running")
  liveness(): LivenessOutput;

  @get
  @route("/startup")
  @doc("Startup probe - checks if application has finished initializing")
  @returnsDoc("Basic connection status without heavy I/O operations")
  startup(): StartupOutput;
}

@tag("Health")
interface RootHealthController {
  @get
  @doc("Liveness probe (root) - checks if application process is alive")
  @returnsDoc("Simple status indicating if the application process is running")
  root(): LivenessOutput;
}
