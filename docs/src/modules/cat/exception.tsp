import "../../utils/model.tsp";
import "../../utils/exceptions.tsp";
import "@typespec/http";
import "@typespec/versioning";

using TypeSpec.Http;
using TypeSpec.Versioning;
using Utils.Model;
using Utils.Exception;
using Utils.Versioning;

namespace api.Cat;

// ## CREATE ## //
@doc("When input is invalid")
@error
model CreateValidationError extends ApiBadRequestException<"name: Required, breed: Required, age: Required"> {
  @statusCode statusCode: 400;
}

alias CreateValidationException = CreateValidationError;

// ## UPDATE ## //
@doc("When input is invalid")
@error
model UpdateValidationError extends ApiBadRequestException<"id: Required"> {
  @statusCode statusCode: 400;
}

alias UpdateValidationException = UpdateValidationError;

@doc("When cat not found")
@error
model UpdateCatNotFoundError extends ApiNotFoundException<"catNotFound"> {
  @statusCode statusCode: 404;
}

alias UpdateNotFoundException = UpdateCatNotFoundError;

// ## GET BY ID ## //
@doc("When input is invalid")
@error
model GetByIdValidationError extends ApiBadRequestException<"id: Required"> {
  @statusCode statusCode: 400;
}

alias GetByIdValidationException = GetByIdValidationError;

@doc("When cat not found")
@error
model GetByIdCatNotFoundError extends ApiNotFoundException<"catNotFound"> {
  @statusCode statusCode: 404;
}

alias GetByIdNotFoundException = GetByIdCatNotFoundError;

// ## DELETE ## //
@doc("When input is invalid")
@error
model DeleteValidationError extends ApiBadRequestException<"id: Required"> {
  @statusCode statusCode: 400;
}

alias DeleteValidationException = DeleteValidationError;

@doc("When cat not found")
@error
model DeleteCatNotFoundError extends ApiNotFoundException<"catNotFound"> {
  @statusCode statusCode: 404;
}

alias DeleteNotFoundException = DeleteCatNotFoundError;
