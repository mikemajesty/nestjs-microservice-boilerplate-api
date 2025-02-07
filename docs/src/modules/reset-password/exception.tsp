import "@typespec/http";
import "../../utils/exceptions.tsp";

using TypeSpec.Http;
using api.Utils.Exception;
using api.Utils.Model;

namespace api.ResetPassword;

// ## Confirm Reset Password ## //
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

@doc("When password are differents")
@error
model ConfirmResetPasswordTokenWasExpiredError extends ApiUnauthorizedException<"token was expired"> {
  @statusCode statusCode: 401;
}

alias ConfirmResetPasswordUnauthorizedException = ConfirmResetPasswordTokenWasExpiredError;

// ## SEND EMAIL ## //
@doc("When user not found")
@error
model SendEmailUserNotFoundError extends ApiNotFoundException<"user not found"> {
  @statusCode statusCode: 404;
}

alias SendEmailNotFoundException = SendEmailUserNotFoundError;
