import "@typespec/http";
import "../../utils/exceptions.tsp";

using TypeSpec.Http;
using api.Utils.Exception;

namespace api.Role;

// ## CREATE ## //
@doc("When input body is invalid")
@error
model CreateBodyValidationError extends ApiBadRequestException<"name: Required"> {
  @statusCode statusCode: 400;
}

alias CreateValidationException = CreateBodyValidationError;

// ## UPDATE ## //
@doc("When input params is invalid")
@error
model UpdateParamsValidationError extends ApiBadRequestException<"id: Required"> {
  @statusCode statusCode: 400;
}

alias UpdateValidationException = UpdateParamsValidationError;

@doc("When role not found")
@error
model UpdateRoleNotFoundError extends ApiNotFoundException<"roleNotFound"> {
  @statusCode statusCode: 404;
}

alias UpdateNotFoundException = UpdateRoleNotFoundError;

// ## GET BY ID ## //
@doc("When input params is invalid")
@error
model GetByIdParamsValidationError extends ApiBadRequestException<"id: Required"> {
  @statusCode statusCode: 400;
}

alias GetByIdValidationException = GetByIdParamsValidationError;

@doc("When role not found")
@error
model GetByIdRoleNotFoundError extends ApiNotFoundException<"roleNotFound"> {
  @statusCode statusCode: 404;
}

alias GetByIdNotFoundException = GetByIdRoleNotFoundError;

// ## DELETE ## //
@doc("When roles has association with permission")
@error
model DeleteHasAssociationError extends ApiConflictException<"roleHasAssociationWithPermission: [permission]"> {
  @statusCode statusCode: 409;
}

alias DeleteConflictException = DeleteHasAssociationError;

@doc("When role not found")
@error
model DeleteRoleNotFoundError extends ApiNotFoundException<"roleNotFound"> {
  @statusCode statusCode: 404;
}

alias DeleteNotFoundException = DeleteRoleNotFoundError;

// ## ADD PERMISSION ## //
@doc("When role not found")
@error
model AddPermissionRoleNotFoundError extends ApiNotFoundException<"roleNotFound"> {
  @statusCode statusCode: 404;
}

alias AddPermissionNotFoundException = AddPermissionRoleNotFoundError;

// ## REMOVE PERMISSION ## //
@doc("When role not found")
@error
model RemovePermissionRoleNotFoundError extends ApiNotFoundException<"roleNotFound"> {
  @statusCode statusCode: 404;
}

alias RemovePermissionNotFoundException = RemovePermissionRoleNotFoundError;
