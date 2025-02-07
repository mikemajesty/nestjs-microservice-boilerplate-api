import "../../utils/model.tsp";
import "@typespec/http";

using TypeSpec.Http;
using api.Utils.Model;

namespace api.Health;

@doc("health output")
model HealthOuput {
  @header contentType: "text/plain";

  @doc("up text")
  @body
  content: string;
}
