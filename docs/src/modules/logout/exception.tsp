import "@typespec/http";
import "../../utils/exceptions.tsp";

using TypeSpec.Http;
using api.Utils.Exception;

namespace api.Logout;

// ## LOGOUT ## //
@doc("When input is invalid")
@error
model LogoutValidationError extends ApiBadRequestException<"token: Required"> {
  @statusCode statusCode: 400;
}

alias LogoutValidationException = LogoutValidationError;
