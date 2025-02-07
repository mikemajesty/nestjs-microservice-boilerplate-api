import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi3";
import "@typespec/versioning";
import "../../utils/model.tsp";
import "./model.tsp";

using TypeSpec.Http;
using TypeSpec.Versioning;
using OpenAPI;
using Utils.Model;

@service({
  title: "Health",
})
namespace api.Health;

@tag("Health")
@route("/")
interface HealthController {
  @get
  @route("/health")
  @doc("app health")
  @returnsDoc("app health successfully")
  health(): HealthOuput;

  @get
  @route("/")
  @doc("app health")
  @returnsDoc("app health successfully")
  health1(): HealthOuput;
}
