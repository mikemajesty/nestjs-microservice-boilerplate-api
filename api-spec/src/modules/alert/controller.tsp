import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi3";
import "../../utils/model.tsp";

using TypeSpec.Http;

@service(#{ title: "Alert" })
namespace api.Alert;

@tag("Alert")
@route("alert")
interface AlertController {
  @post
  @doc("Handle alert webhook")
  @returnsDoc("Alert received successfully")
  handleAlert(@body body: unknown): AlertOutput;
}

@doc("Alert response")
model AlertOutput {
  @doc("Status of alert handling")
  status: string;
}
