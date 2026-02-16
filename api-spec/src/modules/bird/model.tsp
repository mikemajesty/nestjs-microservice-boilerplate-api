import "../../utils/model.tsp";
import "@typespec/http";

using TypeSpec.Http;
using Utils.Model;

namespace api.Bird;

@doc("bird base entity")
model BirdEntity {
  name: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null = null;
}

// CREATE //
@doc("bird create input")
model CreateInput extends PickProperties<BirdEntity, "name"> {}
@doc("bird create output")
model CreateOutput extends BirdEntity {}

// UPDATE //
model UpdateParamInput {
  @doc("bird id")
  @path
  id: string;
}
@doc("bird update input")
model UpdateInput extends PickProperties<BirdEntity, "name"> {}
@doc("bird update output")
model UpdateOutput extends BirdEntity {}

// GET BY ID //
model GetByIdParamInput {
  @doc("bird id")
  @path
  id: string;
}
@doc("bird get by id input")
model GetByIdOutput extends BirdEntity {}

// LIST //
model ListQueryInput extends ApiPaginationInput {}
@doc("bird list output")
model ListOutput extends ApiPaginationOutput<BirdEntity> {}

// DELETE //
model DeleteParamInput {
  @doc("bird id")
  @path
  id: string;
}
@doc("bird delete output")
model DeleteOutput extends OmitProperties<BirdEntity, "deletedAt"> {
  deletedAt: utcDateTime;
}
