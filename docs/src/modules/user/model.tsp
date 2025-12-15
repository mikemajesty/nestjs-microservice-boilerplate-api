import "@typespec/http";
import "@typespec/versioning";
import "@typespec/openapi3";
import "../../utils/exceptions.tsp";
import "../../utils/model.tsp";
import "../../utils/versioning.tsp";

using TypeSpec.Http;

using Utils.Model;

namespace api.User;

@doc("user base entity")
model UserEntity {
  id: string;
  name: string;
  email: string;
  roles: string[];
  createdAt: string;
  updateAt: string;
  deletedAt?: string | null = null;
}

@doc("user create input")
model CreateInput extends OmitProperties<UserEntity, "id" | "createdAt" | "updateAt" | "deletedAt"> {
  password: string;
}
@doc("user created input")
model CreateOutput extends ApiCreatedOutput {}

@doc("user update params input")
model UpdateParamsInput {
  @doc("user id")
  @path
  id: string;
}

@doc("user update input")
model UpdateInput extends OmitProperties<UserEntity, "id" | "createdAt" | "updateAt" | "deletedAt"> {}

@doc("user update output")
model UpdateOutput extends UserEntity {}

@doc("user logged output")
model MeOutput extends PickProperties<UserEntity, "id" | "name" | "email"> {}

@doc("user list query input")
model ListQueryInput extends ApiPaginationInput {}

@doc("user list output")
model ListOutput extends ApiPaginationOutput<UserEntity> {}

@doc("get user by id params input")
model GetByIdParamsInput {
  @doc("user id")
  @path
  id: string;
}

@doc("get user by id output")
model GetByIdOutput extends UserEntity {}

@doc("user change password params input")
model ChangePasswordParamsInput {
  @doc("user id")
  @path
  id: string;
}

@doc("user change password input")
model ChangePasswordInput {
  password: string;
  newPassword: string;
  confirmPassword: string;
}

@doc("user delete params input")
model DeleteParamsInput {
  @doc("user id")
  @path
  id: string;
}

@doc("user delete output")
model DeleteOutput extends OmitProperties<UserEntity, "deletedAt"> {
  deletedAt: utcDateTime;
}
