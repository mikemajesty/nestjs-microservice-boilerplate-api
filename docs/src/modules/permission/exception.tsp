import "@typespec/http";
import "../../utils/exceptions.tsp";

using TypeSpec.Http;
using api.Utils.Exception;

namespace api.Permission;

// ## CREATE ## //
@doc("When input is invalid")
@error
model CreateValidationError extends ApiBadRequestException<"name: Required"> {
  @statusCode statusCode: 400;
}

alias CreateValidationException = CreateValidationError;

@doc("When input is invalid")
@error
model ConflictPermissionExistsError extends ApiConflictException<"permissionExists"> {
  @statusCode statusCode: 409;
}

alias CreateConflictException = ConflictPermissionExistsError;

// ## UPDATE ## //
@doc("When input is invalid")
@error
model UpdateValidationError extends ApiBadRequestException<"id: Required"> {
  @statusCode statusCode: 400;
}

alias UpdateValidationException = UpdateValidationError;

@doc("When permission not found")
@error
model UpdatePermissionNotFoundError extends ApiNotFoundException<"permissionNotFound"> {
  @statusCode statusCode: 404;
}

alias UpdateNotFoundException = UpdatePermissionNotFoundError;

@doc("When permission already exists")
@error
model UpdatePermissionAlreadyExistsError extends ApiNotFoundException<"permissionExists"> {
  @statusCode statusCode: 404;
}

alias UpdateConflictException = UpdatePermissionAlreadyExistsError;

// ## GET BY ID ## //
@doc("When input is invalid")
@error
model GetByIdValidationError extends ApiBadRequestException<"id: Required"> {
  @statusCode statusCode: 400;
}

alias GetByIdValidationException = GetByIdValidationError;

@doc("When permission not found")
@error
model GeyByIdPermissionNotFoundError extends ApiNotFoundException<"permissionNotFound"> {
  @statusCode statusCode: 404;
}

alias GeyByIdNotFoundException = GeyByIdPermissionNotFoundError;

// ## DELETE ## //
@doc("When input is invalid")
@error
model DeleteValidationError extends ApiBadRequestException<"id: Required"> {
  @statusCode statusCode: 400;
}

alias DeleteValidationException = DeleteValidationError;

@doc("When permission not found")
@error
model DeletePermissionNotFoundError extends ApiNotFoundException<"permissionNotFound"> {
  @statusCode statusCode: 404;
}

alias DeleteNotFoundException = DeletePermissionNotFoundError;
