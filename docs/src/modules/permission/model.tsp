import "@typespec/http";
import "../../utils/exceptions.tsp";
import "../../utils/model.tsp";

using TypeSpec.Http;
using api.Utils.Exception;
using api.Utils.Model;

namespace api.Permission;

@doc("permission base entity")
model PermisisonEntity {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null = null;
}

// ## CREATE ## //
@doc("permission create input")
model CreateInput extends PickProperties<PermisisonEntity, "name"> {}
@doc("permission create output")
model CreateOutput extends PermisisonEntity {}

// ## UPDATE ## //
model UpdateParamsInput {
  @doc("permission id")
  @path
  id: string;
}
@doc("permission update input")
model UpdateInput extends PickProperties<PermisisonEntity, "name"> {}
@doc("permission update output")
model UpdateOutput extends PermisisonEntity {}

// ## LIST ## //
@doc("permission list input")
model ListQueryInput extends ApiPaginationInput {}
@doc("permission list output")
model ListOutput extends ApiPaginationOutput<PermisisonEntity> {}

// ## DELETE ## //
model DeleteParamsInput {
  @doc("permission id")
  @path
  id: string;
}
@doc("permission depete output")
model DeleteOutput extends OmitProperties<PermisisonEntity, "deletedAt"> {
  deletedAt: utcDateTime;
}

// ## GET BY ID ## //
model GetByIdParamsInput {
  @doc("permission id")
  @path
  id: string;
}
@doc("permission get by id output")
model GetByIdOutput extends OmitProperties<PermisisonEntity, "deletedAt"> {
  deletedAt: utcDateTime;
}
