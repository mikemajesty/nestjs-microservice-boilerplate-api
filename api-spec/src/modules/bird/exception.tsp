import "../../utils/model.tsp";
import "../../utils/exceptions.tsp";
import "@typespec/http";

using TypeSpec.Http;
using Utils.Exception;

namespace api.Bird;

// CREATE //
@doc("When input is invalid")
@error
model CreateValidationError extends ApiBadRequestException<"name: Required"> {
  @statusCode statusCode: 400;
}

alias CreateValidationException = CreateValidationError;

// UPDATE //
@doc("When input is invalid")
@error
model UpdateValidationError extends ApiBadRequestException<"id: Required"> {
  @statusCode statusCode: 400;
}

alias UpdateValidationException = UpdateValidationError;

@doc("When bird not found")
@error
model UpdateBirdNotFoundError extends ApiNotFoundException<"birdNotFound"> {
  @statusCode statusCode: 404;
}

alias UpdateNotFoundException = UpdateBirdNotFoundError;

// GET BY ID //
@doc("When input is invalid")
@error
model GetByIdValidationError extends ApiBadRequestException<"id: Required"> {
  @statusCode statusCode: 400;
}

alias GetByIdValidationException = GetByIdValidationError;

@doc("When bird not found")
@error
model GetByIdBirdNotFoundError extends ApiNotFoundException<"birdNotFound"> {
  @statusCode statusCode: 404;
}

alias GetByIdNotFoundException = GetByIdBirdNotFoundError;

// DELETE //
@doc("When input is invalid")
@error
model DeleteValidationError extends ApiBadRequestException<"id: Required"> {
  @statusCode statusCode: 400;
}

alias DeleteValidationException = DeleteValidationError;

@doc("When bird not found")
@error
model DeleteBirdNotFoundError extends ApiNotFoundException<"birdNotFound"> {
  @statusCode statusCode: 404;
}

alias DeleteNotFoundException = DeleteBirdNotFoundError;
