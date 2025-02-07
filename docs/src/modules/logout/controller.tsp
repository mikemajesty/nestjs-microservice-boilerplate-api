import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi3";
import "@typespec/versioning";
import "../../utils/exceptions.tsp";
import "../../utils/versioning.tsp";
import "../../utils/model.tsp";
import "./model.tsp";
import "./exception.tsp";

using TypeSpec.Http;
using TypeSpec.Versioning;
using OpenAPI;
using Utils.Versions;
using Utils.Exception;
using Utils.Model;

@service({
  title: "Logout",
})
namespace api.Logout;

@tag("Logout")
@route("/api/logout")
interface LogoutController {
  @doc("user logout")
  @returnsDoc("user logout successfully")
  logout(@body body: LogoutInput): DefaultSuccessResponse<void, 200> | LogoutValidationException;
}
