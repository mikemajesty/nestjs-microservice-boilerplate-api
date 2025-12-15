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
  @doc("Readiness probe - checks if application can handle requests")
  @returnsDoc("Complete system health status with dependencies and metrics")
  readiness(): HealthOuput;

  @get
  @route("/live")
  @doc("Liveness probe - checks if application process is alive")
  @returnsDoc("Simple status indicating if the application process is running")
  liveness(): LivenessOutput;

  @get
  @route("/")
  @doc("Liveness probe (health root) - checks if application process is alive")
  @returnsDoc("Simple status indicating if the application process is running")
  healthRoot(): LivenessOutput;

  @get
  @route("/startup")
  @doc("Startup probe - checks if application has finished initializing")
  @returnsDoc("Basic connection status without heavy I/O operations")
  startup(): StartupOutput;
}

@tag("Health")
@route("/")
interface RootHealthController {
  @get
  @route("/")
  @doc("Liveness probe (root) - checks if application process is alive")
  @returnsDoc("Simple status indicating if the application process is running")
  root(): LivenessOutput;
}
