import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi3";
import "@typespec/versioning";
import "../../utils/exceptions.tsp";
import "../../utils/versioning.tsp";
import "../../utils/model.tsp";
import "./exception.tsp";

using TypeSpec.Http;
using Utils.Versioning;
using Utils.Model;

@service(#{ title: "Logout" })
namespace api.Logout;

@tag("Logout")
@route("/api/{version}/logout")
@useAuth(BearerAuth)
interface LogoutController {
  @doc("""
    Ends the session of the access token sent in the Authorization header.
    Its access and refresh tokens stop working immediately; other sessions of the user are kept.
    """)
  @returnsDoc("session ended")
  logout(...VersionParams): DefaultSuccessResponse<void, 204> | LogoutUnauthorizedError;
}
