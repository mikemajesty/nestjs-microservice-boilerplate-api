import "@typespec/http";
import "../../utils/exceptions.tsp";

using TypeSpec.Http;
using api.Utils.Exception;

namespace api.ResetPassword;

@doc("When password are differents")
@error
model ConfirmResetPasswordPasswordAreDifferentError extends ApiBadRequestException<"passwords are different"> {
  @statusCode statusCode: 400;
}

alias ConfirmResetPasswordBadRequestException = ConfirmResetPasswordPasswordAreDifferentError;

@doc("When user not found")
@error
model ConfirmResetPasswordUserNotFoundError extends ApiNotFoundException<"user not found"> {
  @statusCode statusCode: 404;
}

alias ConfirmResetPasswordNotFoundException = ConfirmResetPasswordUserNotFoundError;

@doc("When the token is not the last reset-password token sent to the user, or it was already used")
@error
model ConfirmResetPasswordTokenWasExpiredError extends ApiUnauthorizedException<"token was expired"> {
  @statusCode statusCode: 401;
}

@doc("When the token is invalid, expired, or is not a reset-password token (e.g. an access token)")
@error
model ConfirmResetPasswordInvalidTokenError extends ApiUnauthorizedException<"invalidToken"> {
  @statusCode statusCode: 401;
}

alias ConfirmResetPasswordUnauthorizedException =
  | ConfirmResetPasswordTokenWasExpiredError
  | ConfirmResetPasswordInvalidTokenError;

@doc("When user not found")
@error
model SendEmailUserNotFoundError extends ApiNotFoundException<"user not found"> {
  @statusCode statusCode: 404;
}

alias SendEmailNotFoundException = SendEmailUserNotFoundError;
