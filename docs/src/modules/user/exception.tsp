import "@typespec/http";
import "../../utils/exceptions.tsp";

using TypeSpec.Http;
using api.Utils.Exception;

namespace api.User;

// ## CREATE ## //
@doc("When user role not found")
@error
model CreateNotFoundError extends ApiNotFoundException<"roleNotFound"> {
  @statusCode statusCode: 404;
}

alias CreateNotFoundException = CreateNotFoundError;

@doc("When input body is invalid")
@error
model CreateBodyValidationError
  extends ApiBadRequestException<"email: Required, name: Required, password: Required, roles: Required"> {
  @statusCode statusCode: 400;
}

alias CreateValidationException = CreateBodyValidationError;

@doc("When user already exists")
@error
model CreateExistConflictError extends ApiConflictException<"userExists"> {
  @statusCode statusCode: 409;
}

alias CreateConflictException = CreateExistConflictError;

// ## UPDATE ## //
@doc("When user not found")
@error
model UpdateUserNotFoundError extends ApiNotFoundException<"userNotFound"> {
  @statusCode statusCode: 404;
}

@doc("When user role not found")
@error
model UpdateRoleNotFoundError extends ApiNotFoundException<"roleNotFound"> {
  @statusCode statusCode: 404;
}

alias UpdateNotFoundException = UpdateRoleNotFoundError | UpdateUserNotFoundError;

@doc("When input params is invalid")
@error
model UpdateParamsValidationError extends ApiBadRequestException<"id: Required"> {
  @statusCode statusCode: 400;
}

alias UpdateValidationException = UpdateParamsValidationError;

@doc("When user already exists")
@error
model UpdateExistConflictError extends ApiConflictException<"userExists"> {
  @statusCode statusCode: 409;
}

alias UpdateConflictException = UpdateExistConflictError;

// ## GET BY ID ## //
@doc("When user not found")
@error
model GetByIdUserNotFoundError extends ApiNotFoundException<"userNotFound"> {
  @statusCode statusCode: 404;
}

alias GetByIdUserNotFoundException = GetByIdUserNotFoundError;

@doc("When input params is invalid")
@error
model GetByIdParamsValidationError extends ApiBadRequestException<"id: Required"> {
  @statusCode statusCode: 400;
}

alias GetByIdValidationException = GetByIdParamsValidationError;

// ## CHANGE PASSWORD ## //
@doc("When user not found")
@error
model ChangePasswordUserNotFoundError extends ApiNotFoundException<"userNotFound"> {
  @statusCode statusCode: 404;
}

@doc("When user role not found")
@error
model ChangePasswordRoleNotFoundError extends ApiNotFoundException<"roleNotFound"> {
  @statusCode statusCode: 404;
}

alias ChangePasswordNotFoundException = ChangePasswordUserNotFoundError | ChangePasswordRoleNotFoundError;

@doc("When user already exists")
@error
model ChangePasswordUserExistConflictError extends ApiConflictException<"userExists"> {
  @statusCode statusCode: 409;
}

alias ChangePasswordConflictException = ChangePasswordUserExistConflictError;

@doc("When input params is invalid")
@error
model ChangePasswordParamsValidationError extends ApiBadRequestException<"id: Required"> {
  @statusCode statusCode: 400;
}

@doc("When input body is invalid")
@error
model ChangePasswordBodyValidationError
  extends ApiBadRequestException<"password: Required, confirmPassword: Required, newPassword"> {
  @statusCode statusCode: 400;
}

alias ChangePasswordValidationException = ChangePasswordParamsValidationError | ChangePasswordBodyValidationError;

// ## DELETE ## //
@doc("When user not found")
@error
model DeleteUserNotFoundError extends ApiNotFoundException<"userNotFound"> {
  @statusCode statusCode: 404;
}

alias DeleteNotFoundException = DeleteUserNotFoundError;

@doc("When input params is invalid")
@error
model DeleteParamsValidationError extends ApiBadRequestException<"id: Required"> {
  @statusCode statusCode: 400;
}

alias DeleteValidationException = DeleteParamsValidationError;
