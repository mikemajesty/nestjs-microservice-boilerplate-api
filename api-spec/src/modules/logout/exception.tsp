import "@typespec/http";
import "../../utils/exceptions.tsp";

using TypeSpec.Http;
using api.Utils.Exception;

namespace api.Logout;

@doc("When the token is missing, invalid or its session was already ended")
@error
model LogoutUnauthorizedError extends ApiUnauthorizedException<"invalidToken" | "you have been logged out"> {
  @statusCode statusCode: 401;
}
