import "../../utils/model.tsp";
import "@typespec/http";

using TypeSpec.Http;
using api.Utils.Model;

namespace api.Role;

@doc("role base entity")
model RoleEntity {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null = null;
}

@doc("role create output")
model CreateOutput extends RoleEntity {}
@doc("role create input")
model CreateInput extends PickProperties<RoleEntity, "name"> {}

@doc("role update params input")
model UpdateParamsInput {
  @doc("role id")
  @path
  id: string;
}

@doc("role update output")
model UpdateOutput extends RoleEntity {}

@doc("role update input")
model UpdateInput extends PickProperties<RoleEntity, "name"> {}

@doc("role get by id params input")
model GetByIdParamsInput {
  @doc("role id")
  @path
  id: string;
}
@doc("role get by id")
model GetByIdOutput extends RoleEntity {}

@doc("list query input")
model ListQueryInput extends ApiPaginationInput {}

@doc("list output")
model ListOutput extends ApiPaginationOutput<RoleEntity> {}

@doc("role delete params input")
model DeleteParamsInput {
  @doc("role id")
  @path
  id: string;
}

@doc("role delete output")
model DeleteOutput extends OmitProperties<RoleEntity, "deletedAt"> {
  deletedAt: utcDateTime;
}

@doc("role add permission input")
model AddPermissionParamsInput {
  @doc("role id")
  @path
  id: string;
}

@doc("role add permission input")
model AddPermissionInput {
  permissions: string[];
}

@doc("role add permission output")
model AddPermissionOutput extends RoleEntity {}

@doc("role add permission input")
model RemovePermissionParamsInput {
  @doc("role id")
  @path
  id: string;
}

@doc("role remove permission input")
model RemovePermissionInput {
  permissions: string[];
}

@doc("role remove permission output")
model RemovePermissionOuput extends RoleEntity {}
