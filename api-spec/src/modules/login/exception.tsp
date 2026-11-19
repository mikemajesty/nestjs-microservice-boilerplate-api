import "@typespec/http";
import "../../utils/exceptions.tsp";

using TypeSpec.Http;
using api.Utils.Exception;

namespace api.Login;

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

alias RefreshNotFoundException = LoginUserNotFoundError | LoginRoleNotFoundError;

@doc("When login input is invalid")
@error
model LoginValidationError extends ApiBadRequestException<"email: Required" | "password: Required"> {
  @statusCode statusCode: 400;
}

@doc("""
  When the email is unknown or the password is wrong. Both cases answer the same error,
  so the endpoint does not reveal which emails have an account.
  """)
@error
model LoginInvalidCredentialsError extends ApiUnauthorizedException<"invalidCredentials"> {
  @statusCode statusCode: 401;
}

@doc("When refresh input is invalid")
@error
model RefreshValidationError extends ApiBadRequestException<"refreshToken: Required"> {
  @statusCode statusCode: 400;
}

@doc("""
  When the refresh token is invalid, expired, already used, or its session was ended
  (logout, password change or reset). Reusing an already used refresh token also ends its session.
  """)
@error
model RefreshInvalidTokenError extends ApiUnauthorizedException<"invalidRefreshToken"> {
  @statusCode statusCode: 401;
}
