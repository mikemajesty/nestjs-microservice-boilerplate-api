import "@typespec/http";
import "../../utils/exceptions.tsp";

using TypeSpec.Http;
using api.Utils.Exception;

namespace api.Login;

// ## LOGIN ## //
@doc("When user not found")
@error
model LoginUserNotFoundError extends ApiNotFoundException<"userNotFound"> {
  @statusCode statusCode: 404;
}

@doc("When user role not found")
@error
model LoginRoleNotFoundError extends ApiNotFoundException<"roleNotFound"> {
  @statusCode statusCode: 404;
}

alias LoginNotFoundException = LoginUserNotFoundError | LoginRoleNotFoundError;

@doc("When login input is invalid")
@error
model LoginValidationError extends ApiBadRequestException<"email: Required" | "password: Required"> {
  @statusCode statusCode: 400;
}

@doc("When user password is wrong")
@error
model LoginWrongPasswordError extends ApiBadRequestException<"incorrectPassword"> {
  @statusCode statusCode: 400;
}

alias LoginInputException = LoginValidationError | LoginWrongPasswordError;
